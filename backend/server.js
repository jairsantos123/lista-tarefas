const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TODOS_FILE = path.join(__dirname, 'todos.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

async function readTodos() {
    try {
        const data = await fs.readFile(TODOS_FILE, 'utf8');
        return JSON.parse(data);
    }   catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function saveTodos(todos) {
    await fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2));
    
}

app.use((req, res, next) => {
    console.log(`${new Data().toISOSting()} - ${req.method} ${req.path}`);
    next();
})

app.get('/api/todos', async (req, res) => {
    try {
       const todos = await readTodos();
       res.json(todos)

    } catch (error) {
        console.error("Erro ao buscar todos: ", error);
        res.status(500).json({error: "Erro interno no servidor"});
    }
})

app.get('api/todos/:id', async (req, res) => {
    try {
        const todos = await readTodos();
        const todo = todos.find(t => t.id === parseInt(req.params.id));

        if (!todo) {
            return res.status(404).json({error: "Tarefinha não encontrada."});
        }

        res.json(todo);
    } catch (error) {
        console.error("Erro ao buscar todos: ", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
})

app.post('api/todos', async (req, res) => {
    try {
        const { text, completed = false } = req.body;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({error: "O texto da tarefinha é obrigatorio!"})
        }
        
        // Essa parte debaixo pode ser utilizado em qualquer projeto.
        if (text.trim().length > 200) {
            return res.status(400).json({error: "Texto da tarefinha deve ter no máximo 200 caracteres!"})
        }

        const todos = await readTodos();

        const newTodo = {
            id: Date.now(),
            text: text.trim(),
            completed: Boolean(completed),
            createdAt: new Date().toISOString(),
            updateAt: new Date().toISOString(),
        }

        todos.push(newTodo);
        await saveTodos(todos);

        res.status(201).json(newTodo);

    } catch (error) {
        console.error('Erro ao criar todo:', error);
        res.status(500).json({error: 'Erro interno no servidor.'});

    }
});

app.put('/api/todos/:id', async (req, res) => {
    try {
        const todos = await readTodos();
        const todoIndex = todos.findIndex(t => t.id === parseInt(req.params.id));

        if (todoIndex === -1) {
            return res.status(404).json({error: "Tarefinha não encontrada"})
        }

        const { text, completed } = req.body;

        if (text !== undefined) {
            if (typeof text !== 'string' || text.trim().length === 0) {
                return res.status(400).json({error: 'Texto da tarefinha não pode esta vazio!'});
            }
            if (text.trim().length > 200) {
                return res.status(400).json({error: "O texto da tarefinha ta grande de mais, la ele..."})
            }
            todos[todoIndex].text = text.trim();
        }

        if (completed !== undefined) {
            todos[todoIndex].completed = Boolean(completed)
        }

        todos[todoIndex].updateAt = new Date().toISOString();

        await saveTodos(todos[todoIndex]);

        res.json(todos)

    } catch (error) {
        console.error('Erro ao atualizar todo:', error);
        res.status(500).json({error: "Erro interno do servidor"});

    }
});

app.delete('/api/todos/:id', async (req, res) => {
    try {
        const todos = await readTodos();
        const todoIndex = todos.findIndex(t => t.id === parseInt(req.params.id));

        if (todoIndex === -1) {
            return res.status(404).json({error: "Tarefa não encontrada"});
        }

        const deletedTodo = todos.splice(todoIndex, 1)[0];
        await saveTodos(todos);

        res.json({ message: 'Tarefa deletada com sucesso!', todo: deletedTodo})
    } catch (error) {
        console.error('Erro ao deletar todo; ', error);
        res.status(500).json({error: "Erro interno do servidor!"})

    }

});

app.delete('/api/todos', async (req, res) => {
    try {
        const todos = await readTodos();
        const remainingTodos = todos.filter(t => !t.completed);
        const deletedCount = todos.length - remainingTodos.length;

        await saveTodos(remainingTodos);

        res.json({
            message: `${deletedCount} ${deletedCount === 1 ? 'tarefa deletada' : 'tarefas deletadas'} com sucesso` , deletedCount
    })
    } catch (error) {
        console.error('Erro ao deletar todos concluídos:', error);
        res.status(500).json({error: "Erro interno do servidor"});

    }
});