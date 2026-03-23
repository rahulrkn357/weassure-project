document.addEventListener("DOMContentLoaded", () => {

  // DARK MODE TOGGLE
  const body = document.getElementById("body");
  const icon = document.getElementById("theme-icon");
  const toggleBtn = document.getElementById("dark-toggle");

  // Load saved theme
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    icon.src = "moon.png";
  } else {
    icon.src = "lightmode.png";
  }

  // LOGO CHANGE
  toggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark-mode");

    if (body.classList.contains("dark-mode")) {
      icon.src = "moon.png";
      localStorage.setItem("theme", "dark");
    } else {
      icon.src = "lightmode.png";
      localStorage.setItem("theme", "light");
    }
  });

  // SYNCING THE THEME ACROSS BACK AND FORWARD NAVIGATION
   window.addEventListener("pageshow", () => {
    const body = document.getElementById("body");
    const icon = document.getElementById("theme-icon");

    if (localStorage.getItem("theme") === "dark") {
      body.classList.add("dark-mode");
      icon.src = "moon.png";
    } else {
      body.classList.remove("dark-mode");
      icon.src = "lightmode.png";
    }
  });


  const cardWrapper = document.getElementById("cardWrapper");


  // ATTACH NETWORK LOGIC
  function attachNetworkLogic() {

    const hospitalForm = document.getElementById("hospitalForm");
    const resetBtn = document.getElementById("resetbtn");
    const insuranceSelect = document.getElementById("insuranceSelect");
    const stateSelect = document.getElementById("stateSelect");
    const citySelect = document.getElementById("citySelect");

    if (!hospitalForm || !insuranceSelect || !stateSelect || !citySelect) {
      return; //TO PREVENT CRASH
    }


    // PINCODE WITH 6 DIGITS & ONLY NUMBERS
    const pincodeInput = hospitalForm.querySelector(
      "input[placeholder='Enter Pincode']"
    );

    if (pincodeInput) {
      pincodeInput.addEventListener("input", () => {
        pincodeInput.value = pincodeInput.value
          .replace(/\D/g, "")
          .slice(0, 6);
      });
    }

    // ===============================
    // STATE DROPDOWN
    // ===============================
    insuranceSelect.addEventListener("change", async () => {
      stateSelect.innerHTML = `<option>Select State</option>`;
      citySelect.innerHTML = `<option>Select City</option>`;

      if (insuranceSelect.value === "Select Insurance Company") return;

      const res = await fetch(`/api/states?insurance=${insuranceSelect.value}`);
      const states = await res.json();

      states.forEach(s => {
        stateSelect.innerHTML += `<option>${s.state}</option>`;
      });
    });

    // CITY DROPDOWN
    stateSelect.addEventListener("change", async () => {
      citySelect.innerHTML = `<option>Select City</option>`;

      if (stateSelect.value === "Select State") return;

      const res = await fetch(
        `/api/cities?insurance=${insuranceSelect.value}&state=${stateSelect.value}`
      );
      const cities = await res.json();

      cities.forEach(c => {
        citySelect.innerHTML += `<option>${c.city}</option>`;
      });
    });


    // SEARCH
    hospitalForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const params = new URLSearchParams({
        insurance: insuranceSelect.value,
        state: stateSelect.value,
        city: citySelect.value,
        pincode: pincodeInput?.value || "",
        type: "network"
      });

      try {
        const res = await fetch(`/api/hospitals?${params.toString()}`);
        const data = await res.json();
        renderResults(data);
      } catch (err) {
        console.error(err);
      }
    });

    // ===============================
    // RESET
    // ===============================
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        hospitalForm.reset();
        stateSelect.innerHTML = `<option>Select State</option>`;
        citySelect.innerHTML = `<option>Select City</option>`;

        document.getElementById("resultsContainer")?.remove();
      });
    }
  }


  // ===============================
  // RENDER RESULTS
  // ===============================
  function renderResults(data) {
    const existing = document.getElementById("resultsContainer");
    if (existing) existing.remove();

    const container = document.createElement("div");
    container.id = "resultsContainer";
    container.className = "mt-5 w-full px-6";

    if (!data || data.length === 0) {
      container.innerHTML =
        `<p class="text-slate-600 text-[13px]">No hospitals found.</p>`;
    } else {

      //HEADING
      container.innerHTML = `
        <div class="p-4 mb-1 bg-white text-black text-[13px] 
             grid grid-cols-4 gap-6 text-center font-semibold
             border-b border-slate-300">
          <p>Hospital Name</p>
          <p>Address</p>
          <p>Pincode</p>
          <p>Contact Number</p>
        </div>
      `;

      //RESULT OF HOSPITAL NETWORK
      data.forEach(h => {
        container.innerHTML += `
          <div class="p-4 mb-2 bg-white shadow-sm text-[13px]
               grid grid-cols-4 gap-6 text-center">
            <p>${h.hospital_name}</p>
            <p>${h.address}, ${h.city}, ${h.state}</p>
            <p>${h.pincode}</p>
            <p>${h.contact_number}</p>
          </div>
        `;
      });
    }

    cardWrapper.appendChild(container);
  }





  // INITIAL CALL (IMPORTANT)
  attachNetworkLogic();

  // ECARD CODE
  const resultBox = document.getElementById("ecardResult");
  const cardBox = document.getElementById("ecardCard");
  const ecardForm1 = document.getElementById("ecardForm1");
  const ecardForm2 = document.getElementById("ecardForm2");

  const insuranceLogos = {
    NIAC: "/NIAC.png",
    NIC: "/NIC.png",
    OIC: "/OIC.png",
    UIIC: "/UIIC.png"
  };

  if (!(resultBox && cardBox && ecardForm1 && ecardForm2)) {
    return;
  }

  function getJsPDF() {
    return window.jspdf?.jsPDF || window.jsPDF || null;
  }

  function loadImageForPdf(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";

      const done = (value) => {
        clearTimeout(timer);
        resolve(value);
      };

      const timer = setTimeout(() => done(null), 4000);
      img.onload = () => done(img);
      img.onerror = () => done(null);
      img.src = src;
    });
  }

  function waitForImages(container) {
    const images = Array.from(container.querySelectorAll("img"));
    return Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    }));
  }


  async function downloadSimpleDataPdf(data) {
    const JsPDF = getJsPDF();
    if (!JsPDF) {
      alert("PDF library missing: jsPDF is not available.");
      return;
    }

    const pdf = new JsPDF("p", "mm", "a4");

    const dobObj = new Date(data.DateOfBirth);
    const formattedDOB = Number.isNaN(dobObj.getTime())
      ? ""
      : dobObj.toLocaleDateString("en-IN");

    const leftX = 16;
    const rightX = 138;
    let y = 22;
    const logoSrc = insuranceLogos[data.InsuranceName] || "";

    pdf.setDrawColor(209, 213, 219);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(10, 12, 190, 120, 3, 3, "FD");

    const logoImg = await loadImageForPdf(logoSrc);
    if (logoImg) {
      pdf.addImage(logoImg, "PNG", 74, 16, 62, 16);
      y = 40;
    }

    const drawField = (x, yPos, label, value) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(`${label}:`, x, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(String(value ?? ""), x + 27, yPos);
    };

    drawField(leftX, y, "Name", data.EmpName);
    drawField(rightX, y, "UHID", data.UHID);
    y += 9;

    drawField(leftX, y, "Employee ID", data.EmpID);
    drawField(rightX, y, "Age/Gender", data.AgeGender);
    y += 9;

    drawField(leftX, y, "DOB", formattedDOB);
    drawField(rightX, y, "Mobile", data.ContactNumber);
    y += 9;

    drawField(leftX, y, "Corporate", data.CorporateName);
    y += 9;
    drawField(leftX, y, "Policy No", data.PolicyNumber);
    y += 9;
    drawField(leftX, y, "Policy Period", data.PolicyPeriod);

    pdf.setDrawColor(209, 213, 219);
    pdf.line(16, 108, 194, 108);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(21, 141, 227);
    pdf.text("WeAssure", 16, 118);

    pdf.setTextColor(17, 24, 39);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("WeAssure TPA Pvt Ltd", 194, 114, { align: "right" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Head Office: 4th Floor,", 194, 119, { align: "right" });
    pdf.text("Sigma Towers, Anna Salai,", 194, 123, { align: "right" });
    pdf.text("Chennai – 600018, Tamil Nadu, India", 194, 127, { align: "right" });

    pdf.save(`${String(data.EmpID || "ecard")}.pdf`);
  }


  function renderCard(data) {
    resultBox.classList.remove("hidden");

    const dobObj = new Date(data.DateOfBirth);
    const formattedDOB = Number.isNaN(dobObj.getTime())
      ? ""
      : dobObj.toLocaleDateString("en-IN");

    const logoSrc = insuranceLogos[data.InsuranceName] || "";

    cardBox.innerHTML = `
      <div id="ecardPDF" style="background:#fff;color:#111827;box-shadow:0 10px 20px rgba(0,0,0,0.12);border-radius:12px;padding:24px;width:500px;margin:0 auto;font-family:Arial,sans-serif;">
        ${logoSrc ? `
          <div style="display:flex;justify-content:center;margin-bottom:16px;">
            <img src="${logoSrc}" alt="${data.InsuranceName}" style="height:48px;max-width:220px;object-fit:contain;" />
          </div>
        ` : ""}

        <div style="display:grid;grid-template-columns:1fr; column-gap:12px; row-gap:10px; font-size:13px;padding-bottom:24px;line-height:1.35;">
          <div><span style="font-weight:700;">Name:</span> ${data.EmpName || ""}</div>
          <div><span style="font-weight:700;">UHID:</span> ${data.UHID || ""}</div>
          <div><span style="font-weight:700;">Employee ID:</span> ${data.EmpID || ""}</div>
          <div><span style="font-weight:700;">Age/Gender:</span> ${data.AgeGender || ""}</div>
          <div><span style="font-weight:700;">DOB:</span> ${formattedDOB}</div>
          <div><span style="font-weight:700;">Mobile:</span> ${data.ContactNumber || ""}</div>
          <div style="grid-column:1 / span 2;"><span style="font-weight:700;">Policy No:</span> ${data.PolicyNumber || ""}</div>
          <div style="grid-column:1 / span 2;"><span style="font-weight:700;">Policy Period:</span> ${data.PolicyPeriod || ""}</div>
          <div style="grid-column:1 / span 2;"><span style="font-weight:700;">Corporate:</span> ${data.CorporateName || ""}</div>
        </div>

        <div style="border-top:1px solid #d1d5db;padding-top:16px;margin-top:8px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
          <div style="font-size:16px;font-weight:700;color:#158DE3;">WeAssure</div>
          <div style="text-align:left;font-size:10px;color:#111827;line-height:1.3;">
            <div style="font-weight:600;font-size:12px;">WeAssure TPA Pvt Ltd</div>
            <div>Head Office: 4th Floor,</div>
            <div>Sigma Towers, Anna Salai,</div> 
            <div>Chennai – 600018, Tamil Nadu, India</div>
          </div>
        </div>
      </div>
    `;



    // DOWNLOAD PDF AFTER ECARD TRIGGERED
    setTimeout(async () => {
      try {
        const card = document.getElementById("ecardPDF");
        if (!card) return;

        if (!window.html2canvas) {
          await downloadSimpleDataPdf(data);
          return;
        }

        const JsPDF = getJsPDF();
        if (!JsPDF) {
          alert("PDF library missing: jsPDF is not available.");
          return;
        }

        await waitForImages(card);

        const canvas = await window.html2canvas(card, {
          scale: 2,
          backgroundColor: "#ffffff"
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new JsPDF("p", "mm", "a4");

        const pdfWidth = 190;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
        pdf.save(`${String(data.EmpID || "ecard")}.pdf`);
      } catch (error) {
        // Typical issue: unsupported CSS colors like oklch
        console.warn("Styled card PDF failed, using simple PDF fallback.", error);
        await downloadSimpleDataPdf(data);
      }
    }, 300);
  }

  async function submitForm(payload) {
    const params = new URLSearchParams(payload).toString();
    const res = await fetch(`/api/ecard?${params}`);
    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    renderCard(data);
  }

  ecardForm1.addEventListener("submit", (event) => {
    event.preventDefault();
    const uhid = event.target.querySelector('input[type="text"]').value.trim();
    const dob = event.target.querySelector('input[type="date"]').value;
    void submitForm({ uhid, dob });
  });

  ecardForm2.addEventListener("submit", (event) => {
    event.preventDefault();
    const inputs = event.target.querySelectorAll("input");
    void submitForm({
      empid: inputs[0]?.value.trim() || "",
      phone: inputs[1]?.value.trim() || ""
    });
  });

  // TO RESET THE VALUES
  function clearEcard() {
    cardBox.innerHTML = "";
    resultBox.classList.add("hidden");
  }

  ecardForm1.addEventListener("reset", clearEcard);
  ecardForm2.addEventListener("reset", clearEcard);
});


// DOM ENDS HERE   
