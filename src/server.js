require('dotenv').config();

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

const connectDb = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const catwayRoutes = require('./routes/catways');
const reservationsAllRoutes = require('./routes/reservationsAll');
const docsRoutes = require('./routes/docs');
const uiRoutes = require('./routes/ui');
const { authRequired, authOptional } = require('./middleware/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] || 'unknown';
  return res.json({
    ok: state === 'connected',
    db: {
      state,
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null
    },
    time: new Date().toISOString()
  });
});

app.get('/', authOptional, (req, res) => {
  if (req.user) {
    return res.redirect('/ui/dashboard');
  }
  return res.render('index', { error: null });
});

app.use('/', authRoutes);
app.use('/docs', docsRoutes);

app.use('/ui', authRequired, uiRoutes);

app.use('/users', authRequired, userRoutes);
app.use('/reservations', authRequired, reservationsAllRoutes);
app.use('/catways', authRequired, catwayRoutes);
app.use('/catway', authRequired, catwayRoutes);

app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).render('404');
  }
  return res.status(404).json({ error: 'Not Found' });
});

const port = process.env.PORT || 3000;

async function startServer() {
  await connectDb();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
