
// Theme toggle functionality
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');

    if (body.classList.contains('dark')) {
        body.classList.remove('dark');
        icon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark');
        icon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('theme-icon').textContent = '☀️';
}

class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.apiUrl = 'http://localhost:3000/api';
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadTodos();
    }

    bindEvents() {
        const input = document.getElementById('todoInput');
        const addBtn = document.getElementById('addBtn');
        const filterBtns = document.querySelectorAll('.filter-btn');

        addBtn.addEventListener('click', () => this.addTodo());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    async loadTodos() {
        try {
            const response = await fetch(`${this.apiUrl}/todos`);
            if (!response.ok) throw new Error('Erro ao carregar tarefas');

            this.todos = await response.json();
            this.renderTodos();
            this.hideError();
        } catch (error) {
            console.error('Erro ao carregar todos:', error);
            this.showError('Erro ao conectar com o servidor. Usando dados locais.', 'warning');
            this.loadLocalTodos();
        }

        document.getElementById('loading').style.display = 'none';
    }

    loadLocalTodos() {
        const saved = localStorage.getItem('todos');
        this.todos = saved ? JSON.parse(saved) : [];
        this.renderTodos();
    }

    saveLocal() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    async addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();

        if (!text) return;

        const newTodo = {
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`${this.apiUrl}/todos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTodo)
            });

            if (!response.ok) throw new Error('Erro ao adicionar tarefa');

            const todo = await response.json();
            this.todos.push(todo);
            input.value = '';
            this.renderTodos();
            this.saveLocal();
            this.hideError();
        } catch (error) {
            console.error('Erro ao adicionar todo:', error);
            newTodo.id = Date.now();
            this.todos.push(newTodo);
            input.value = '';
            this.renderTodos();
            this.saveLocal();
            this.showError('Modo offline: tarefa salva localmente', 'warning');
        }
    }

    async toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        try {
            const response = await fetch(`${this.apiUrl}/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed: !todo.completed })
            });

            if (!response.ok) throw new Error('Erro ao atualizar tarefa');

            todo.completed = !todo.completed;
            this.renderTodos();
            this.saveLocal();
            this.hideError();
        } catch (error) {
            console.error('Erro ao atualizar todo:', error);
            todo.completed = !todo.completed;
            this.renderTodos();
            this.saveLocal();
            this.showError('Modo offline: alteração salva localmente', 'warning');
        }
    }

    async editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        const newText = prompt('Editar tarefa:', todo.text);
        if (!newText || newText.trim() === todo.text) return;

        try {
            const response = await fetch(`${this.apiUrl}/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: newText.trim() })
            });

            if (!response.ok) throw new Error('Erro ao editar tarefa');

            todo.text = newText.trim();
            this.renderTodos();
            this.saveLocal();
            this.hideError();
        } catch (error) {
            console.error('Erro ao editar todo:', error);
            todo.text = newText.trim();
            this.renderTodos();
            this.saveLocal();
            this.showError('Modo offline: edição salva localmente', 'warning');
        }
    }

    async deleteTodo(id) {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

        try {
            const response = await fetch(`${this.apiUrl}/todos/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erro ao excluir tarefa');

            this.todos = this.todos.filter(t => t.id !== id);
            this.renderTodos();
            this.saveLocal();
            this.hideError();
        } catch (error) {
            console.error('Erro ao deletar todo:', error);
            this.todos = this.todos.filter(t => t.id !== id);
            this.renderTodos();
            this.saveLocal();
            this.showError('Modo offline: exclusão salva localmente', 'warning');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.renderTodos();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(t => t.completed);
            case 'pending':
                return this.todos.filter(t => !t.completed);
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            const emptyMessage = this.currentFilter === 'all' ?
                'Você ainda não tem tarefas.<br>Adicione uma nova para começar!' :
                `Nenhuma tarefa ${this.currentFilter === 'completed' ? 'concluída' : 'pendente'} encontrada.`;

            todoList.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">📝</div>
                            <div>${emptyMessage}</div>
                        </div>
                    `;
        } else {
            todoList.innerHTML = filteredTodos.map(todo => `
                        <li class="todo-item ${todo.completed ? 'completed' : ''}">
                            <input 
                                type="checkbox" 
                                class="todo-checkbox"
                                ${todo.completed ? 'checked' : ''}
                                onchange="app.toggleTodo(${todo.id})"
                            >
                            <span class="todo-text">${todo.text}</span>
                            <div class="todo-actions">
                                <button class="btn btn-ghost" onclick="app.editTodo(${todo.id})" title="Editar">
                                    ✏️
                                </button>
                                <button class="btn btn-destructive" onclick="app.deleteTodo(${todo.id})" title="Excluir">
                                    🗑️
                                </button>
                            </div>
                        </li>
                    `).join('');
        }

        this.updateStats();
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        let statsText = '';
        if (total === 0) {
            statsText = 'Nenhuma tarefa';
        } else {
            statsText = `${total} ${total === 1 ? 'tarefa' : 'tarefas'}`;
            if (completed > 0) {
                statsText += ` • ${completed} ${completed === 1 ? 'concluída' : 'concluídas'}`;
            }
            if (pending > 0) {
                statsText += ` • ${pending} ${pending === 1 ? 'pendente' : 'pendentes'}`;
            }
        }

        document.getElementById('statsText').textContent = statsText;
    }

    showError(message, type = 'destructive') {
        const errorContainer = document.getElementById('error-container');
        errorContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    }

    hideError() {
        const errorContainer = document.getElementById('error-container');
        errorContainer.innerHTML = '';
    }
}

// Initialize app
const app = new TodoApp();
