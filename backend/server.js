import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import produitsRoutes      from './routes/produits.js';
import ventesRoutes        from './routes/ventes.js';
import facturesRoutes      from './routes/factures.js';
import rapportsRoutes      from './routes/rapports.js';
import authRoutes          from './routes/auth.js';
import achatsDirectsRoutes from './routes/achats-directs.js';
import inventairesRoutes   from './routes/inventaires.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',           authRoutes);
app.use('/api/produits',       produitsRoutes);
app.use('/api/ventes',         ventesRoutes);
app.use('/api/factures',       facturesRoutes);
app.use('/api/rapports',       rapportsRoutes);
app.use('/api/achats-directs', achatsDirectsRoutes);
app.use('/api/inventaires',    inventairesRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');
    app.listen(process.env.PORT, () =>
      console.log(`🚀 Serveur : http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => console.error('❌ MongoDB erreur:', err));