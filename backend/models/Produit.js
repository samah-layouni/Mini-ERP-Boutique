import mongoose from 'mongoose';

const produitSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true, trim: true, uppercase: true },
  nom:       { type: String, required: true },
  categorie: { type: String, default: '' },
  prixAchat: { type: Number, default: 0 },
  prixVente: { type: Number, default: 0 },
  stock:     { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Produit', produitSchema);