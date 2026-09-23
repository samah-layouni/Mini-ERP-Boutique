import mongoose from 'mongoose';

const ligneInventaireSchema = new mongoose.Schema({
  produit:        { type: mongoose.Schema.Types.ObjectId, ref: 'Produit' },
  code:           String,
  nom:            String,
  stockTheorique: Number,
  stockCompte:    Number,
  ecart:          Number,
  note:           String,
});

const inventaireSchema = new mongoose.Schema({
  reference:  { type: String, required: true, unique: true },
  dateDebut:  { type: Date, default: Date.now },
  dateFin:    { type: Date },
  statut:     { type: String, enum: ['en_cours', 'valide'], default: 'en_cours' },
  lignes:     [ligneInventaireSchema],
  note:       { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Inventaire', inventaireSchema);