console.log("🚀 Server file started");
const express = require("express");
const db = require("./database");

const app = express();

app.use(express.json());


// TEST ROUTE
app.get("/test", (req, res) => {
  res.json({ message: "Server and API are working" });
});

// HOSPITAL API
app.get("/api/hospitals", (req, res) => {
  const { insurance, state, city, pincode, type } = req.query;

  // CHOOSE TABLE BASED ON TYPE
  let table = type === "blacklisted" ? "blacklisted" : "hospital_master";

  let sql;
  let params = [];

  //BLACKLISTED: filter ONLY by insurance
  if (type === "blacklisted") {
    sql = `SELECT * FROM blacklisted WHERE insurance = ?`;
    params.push(insurance);
  }

  //NETWORK hospitals
  else {
    if (pincode) {
      sql = `SELECT * FROM hospital_master WHERE pincode = ?`;
      params.push(pincode);
    } else {
      sql = `SELECT * FROM hospital_master WHERE insurance = ?`;
      params.push(insurance);

      if (state && state !== "Select State") {
        sql += " AND state = ?";
        params.push(state);
      }
      if (city && city !== "Select City") {
        sql += " AND city = ?";
        params.push(city);
      }
    }
  }


  db.query(sql, params, (err, results) => {
    if (err) {
      console.log("DB ERROR:", err);
      res.status(500).json({ error: "Database query failed" });
    } else {
      res.json(results);
    }
  });
});

// SERVE STATIC FILES (HTML, CSS, JS)
app.use(express.static("public"));



// TO GET STATES
app.get("/api/states", (req, res) => {
  const { insurance } = req.query;

  const sql = `
    SELECT DISTINCT state 
    FROM hospital_master 
    WHERE insurance = ?
    ORDER BY state
  `;

  db.query(sql, [insurance], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});



// TO GET CITIES
app.get("/api/cities", (req, res) => {
  const { insurance, state } = req.query;

  const sql = `
    SELECT DISTINCT city 
    FROM hospital_master 
    WHERE insurance = ? AND state = ?
    ORDER BY city
  `;

  db.query(sql, [insurance, state], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});




// ===============================
// E-CARD API
// ===============================
app.get("/api/ecard", (req, res) => {
  const { uhid, dob, empid, phone } = req.query;

  let sql = `
    SELECT 
      InsuranceName,
      UHID,
      EmpID,
      EmpName,
      AgeGender,
      DateOfBirth,
      ContactNumber,
      PolicyNumber,
      PolicyPeriod,
      CorporateName
    FROM ecard.ecard_data
  `;

  let params = [];

  // METHOD 1: UHID + DOB
  if (uhid && dob) {
    sql += " WHERE UHID = ? AND DateOfBirth = ?";
    params = [uhid, dob];
  }

  // METHOD 2: EmpID + Phone
  else if (empid && phone) {
    sql += " WHERE EmpID = ? AND ContactNumber = ?";
    params = [empid, phone];
  }

  else {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error("E-CARD DB ERROR:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (rows.length === 0) {
      return res.json({ error: "No record found" });
    }

    res.json(rows[0]); // UNIQUE record
  });
});





// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});