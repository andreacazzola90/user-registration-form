"use client";

import React, { useState } from "react";
import { FormConfig, SliderSlide } from "@/lib/types";
import {
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface AdminSliderManagerProps {
  formId: string;
  form: FormConfig;
  onUpdate?: (updatedForm: FormConfig) => void;
}

export default function AdminSliderManager({
  formId,
  form,
  onUpdate,
}: AdminSliderManagerProps) {
  const [slides, setSlides] = useState<SliderSlide[]>(form.slider_data || []);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SliderSlide>({
    kicker: "",
    title: "",
    description: "",
    imageUrl: "",
  });

  const handleAddSlide = () => {
    setEditingIndex(-1);
    setEditForm({
      kicker: "",
      title: "",
      description: "",
      imageUrl: "",
    });
  };

  const handleEditSlide = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...slides[index] });
  };

  const handleSaveSlide = () => {
    if (
      !editForm.kicker.trim() ||
      !editForm.title.trim() ||
      !editForm.description.trim() ||
      !editForm.imageUrl.trim()
    ) {
      alert("Tutti i campi sono obbligatori");
      return;
    }

    const newSlides = [...slides];
    if (editingIndex === -1) {
      newSlides.push(editForm);
    } else if (editingIndex !== null) {
      newSlides[editingIndex] = editForm;
    }
    setSlides(newSlides);
    setEditingIndex(null);
  };

  const handleDeleteSlide = () => {
    if (deleteIndex !== null) {
      const newSlides = slides.filter((_, i) => i !== deleteIndex);
      setSlides(newSlides);
      setDeleteIndex(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Errore upload: ${error.message}`);
        return;
      }

      const { imageUrl } = await response.json();
      setEditForm((prev) => ({ ...prev, imageUrl }));
    } catch (error) {
      console.error("Upload error:", error);
      alert("Errore durante l'upload dell'immagine");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/forms", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: formId,
          title: form.title,
          description: form.description,
          info_title: form.info_title,
          info_description: form.info_description,
          registration_title: form.registration_title,
          registration_description: form.registration_description,
          submit_note: form.submit_note,
          slider_data: slides,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Errore: ${error.message}`);
        return;
      }

      const updatedForm = {
        ...form,
        slider_data: slides,
      };
      onUpdate?.(updatedForm);
      alert("Slide salvate con successo");
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      alert("Errore nel salvataggio delle slide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gestione Slide</h3>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddSlide}
          disabled={loading || editingIndex !== null}
        >
          Aggiungi Slide
        </Button>
      </div>

      <div className="space-y-3">
        {slides.map((slide, index) => (
          <Card key={index} className="border border-gray-200">
            <CardContent>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Typography variant="caption" sx={{ color: "#5f6f7b" }}>
                    Titolo
                  </Typography>
                  <p className="font-semibold text-lg">{slide.title}</p>
                  <Typography
                    variant="caption"
                    sx={{ color: "#5f6f7b", display: "block", mt: 1 }}
                  >
                    Kicker
                  </Typography>
                  <p className="text-sm text-gray-700">{slide.kicker}</p>
                  <Typography
                    variant="caption"
                    sx={{ color: "#5f6f7b", display: "block", mt: 1 }}
                  >
                    Descrizione
                  </Typography>
                  <p className="text-sm text-gray-700">{slide.description}</p>
                  <div className="w-16 max-w-16">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="mt-3 h-20 w-36 object-cover rounded border border-gray-200"
                    />
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditSlide(index)}
                    disabled={editingIndex !== null}
                  >
                    Modifica
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteIndex(index)}
                    disabled={editingIndex !== null}
                  >
                    Elimina
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingIndex !== null && (
        <Card className="bg-blue-50 border-2 border-blue-300">
          <CardHeader
            title={editingIndex === -1 ? "Nuova Slide" : "Modifica Slide"}
          />
          <CardContent className="space-y-6">
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Kicker
              </Typography>
              <TextField
                label="Kicker"
                value={editForm.kicker}
                onChange={(e) =>
                  setEditForm({ ...editForm, kicker: e.target.value })
                }
                fullWidth
                size="small"
                placeholder="es. Escursione"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Titolo
              </Typography>
              <TextField
                label="Titolo"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                fullWidth
                size="small"
                placeholder="Titolo della slide"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Descrizione
              </Typography>
              <TextField
                label="Descrizione"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                fullWidth
                multiline
                minRows={4}
                placeholder="Descrizione della slide"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <Box className="space-y-3">
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Immagine
              </Typography>
              <Box
                sx={{
                  border: "2px dashed #0f8a84",
                  borderRadius: 1,
                  p: 2,
                  textAlign: "center",
                  cursor: uploadingImage ? "not-allowed" : "pointer",
                  opacity: uploadingImage ? 0.6 : 1,
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: "none" }}
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  style={{ cursor: uploadingImage ? "not-allowed" : "pointer" }}
                >
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={
                      uploadingImage ? (
                        <CircularProgress size={20} />
                      ) : (
                        <CloudUploadIcon />
                      )
                    }
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? "Caricamento..." : "Seleziona immagine"}
                  </Button>
                </label>
              </Box>
              {editForm.imageUrl && (
                <Box>
                  <img
                    src={editForm.imageUrl}
                    alt="Preview"
                    className="w-24 h-16 object-cover rounded border border-gray-300"
                  />
                  <Typography
                    variant="caption"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Immagine caricata: {editForm.imageUrl.split("/").pop()}
                  </Typography>
                </Box>
              )}
            </Box>
            <div className="flex gap-2 pt-4">
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveSlide}
                disabled={loading}
              >
                Salva Slide
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setEditingIndex(null);
                  setEditForm({
                    kicker: "",
                    title: "",
                    description: "",
                    imageUrl: "",
                  });
                }}
                disabled={loading}
              >
                Annulla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 pt-4">
        <Button
          variant="contained"
          color="success"
          onClick={handleSaveAll}
          disabled={loading || editingIndex !== null}
        >
          {loading ? <CircularProgress size={24} /> : "Salva Tutte le Slide"}
        </Button>
      </div>

      <Dialog open={deleteIndex !== null} onClose={() => setDeleteIndex(null)}>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          Sei sicuro di voler eliminare questa slide?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteIndex(null)}>Annulla</Button>
          <Button variant="contained" color="error" onClick={handleDeleteSlide}>
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
