const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/agenda', { useNewUrlParser: true, useUnifiedTopology: true });

// Define Mongoose schemas
const clienteSchema = new mongoose.Schema({ name: String });
const procedimentoSchema = new mongoose.Schema({ name: String });
const varianteSchema = new mongoose.Schema({ name: String });
const agendamentoSchema = new mongoose.Schema({ date: Date });
const financeiroSchema = new mongoose.Schema({ amount: Number });
const interesseSchema = new mongoose.Schema({ topic: String });

// Create Mongoose models
const Cliente = mongoose.model('Cliente', clienteSchema);
const Procedimento = mongoose.model('Procedimento', procedimentoSchema);
const Variante = mongoose.model('Variante', varianteSchema);
const Agendamento = mongoose.model('Agendamento', agendamentoSchema);
const Financeiro = mongoose.model('Financeiro', financeiroSchema);
const Interesse = mongoose.model('Interesse', interesseSchema);

// Middleware to check authentication
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(403);
    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Authentication route
app.post('/login', (req, res) => {
    // Authentication logic here (e.g., checking user credentials)
    const user = { name: req.body.name };
    const token = jwt.sign(user, 'your_jwt_secret');
    res.json({ token });
});

// CRUD routes for clientes
app.post('/clientes', authenticateToken, async (req, res) => {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).send(cliente);
});

app.get('/clientes', authenticateToken, async (req, res) => {
    const clientes = await Cliente.find();
    res.send(clientes);
});

app.put('/clientes/:id', authenticateToken, async (req, res) => {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.send(cliente);
});

app.delete('/clientes/:id', authenticateToken, async (req, res) => {
    await Cliente.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
});

// Similar CRUD endpoints for procedimentos, variantes, agendamentos, financeiro, e interesses go here
// Example for procedimentos
app.post('/procedimentos', authenticateToken, async (req, res) => {
    const procedimento = new Procedimento(req.body);
    await procedimento.save();
    res.status(201).send(procedimento);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
