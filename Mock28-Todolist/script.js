//select DOM elements
const todoinput= document.getElementById('input')
const todobtn= document.getElementById('add-btn')
const todolist=document.getElementById('list')

// load todos from local Storage
const saved= localStorage.getItem('todos');
const todos=saved? JSON.parse(saved) :[];

function save(){
// to save the datas added in local storage
localStorage.setItem('todos',JSON.stringify(todos));
}

// create a DOM node for todo object and append it to list
function createtodonode(todo, index){
    const li=document.createElement('li');

    // checkbox to toggle completion
    const checkbox=document.createElement('input');
    checkbox.type='checkbox';
    checkbox.checked=!!todo.completed;
    checkbox.addEventListener("change",()=>{
        todo.completed=checkbox.checked;

        // TODO:    visual feedback: strike-through when completed
        saveTodos();
    })

    // Text of the todo
    const textSpan=document.createElement("span");
    textSpan.textContent = todo.text;
    textSpan.style.margin= '0 8px';

    if(todo.completed()){
        textSpan.style.textDecoration = 'line-through';
    }


    //    add double-click event listener to edit todo
    textSpan.addEventListener("dblclick",()=>{
        const newText = prompt("Edit todo",todo.text);
        if(newText !== null){
            todo.text = newText.trim()
            textSpan.textContent= todo.text;
            saveTodos();
        }
    })

    // Delete todo button
    const delBtn = document.createElement('Button');
    delBtn.textContent = "Delete";
    delBtn.addEventListener('click',()=>{
    todo.splice(index,1);
    render();
    saveTodos(); 
    })

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(delBtn);
    return li 
}

// render the whole todo list from todos array
function render(){
list.innerHTML='';

// Recreate each item
todos.array.forEach((todo,index) => {
    const node= createTodonode(todo,index);
    list.appendChild(node)
});
}

function addTodo(){
    const text= input.value.trim();
    if(!text){
        return
    }

    // Push a new todo object
    todos.push({text, completed:false});
    input.value = "";
    render()
    saveTodos();
}

addBtn.addEventListener("click",addTodo);
render();
