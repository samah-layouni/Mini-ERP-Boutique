import mongoose from 'mongoose';

const depenseSchema = new mongoose.Schema({
  libelle:   { type: String, required: true },
  montant:   { type: Number, required: true },
  categorie: { type: String, default: '' },
  date:      { type: Date, default: Date.now },
  note:      { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Depense', depenseSchema);