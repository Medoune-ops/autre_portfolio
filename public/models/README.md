# Modèle cerveau (GLB)

Place ici un fichier `brain.glb` segmenté en **une mesh par partie**.

## Convention de noms (meshes/objets)
Utilise ces identifiants pour que la scène les mappe automatiquement :
- `frontal`
- `parietal`
- `temporal`
- `occipital`
- `cerebellum`
- `brainstem`

## Fallback
Si `public/models/brain.glb` est absent, la scène génère un **cerveau procédural** (sphères/ellipsoïdes déformées par bruit) avec les mêmes parties et la même timeline de scroll.  
Pour brancher un vrai modèle : exporter en `.glb` (glTF binaire), séparer chaque région en mesh nommée comme ci-dessus, puis déposer le fichier ici sous le nom `brain.glb`.
