import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Créer l'admin par défaut (une seule fois)
router.post('/init', async (req, res) => {
  try {
    const exists = await User.findOne({ username: 'admin' });
    if (exists) return res.json({ msg: 'Admin existe déjà' });
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hash, role: 'admin' });
    res.json({ msg: 'Admin créé (admin / admin123)' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Utilisateur introuvable' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Mot de passe incorrect' });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Changer le mot de passe (depuis le login)
router.post('/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit avoir au moins 4 caractères' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Utilisateur introuvable' });

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(400).json({ error: 'Ancien mot de passe incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    res.json({ msg: '✅ Mot de passe changé avec succès' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;