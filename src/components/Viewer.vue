<template>
  <div style="height: 100vh; width: 100%">
    <div ref="viewerRef" style=""></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const viewerRef = ref(null)
const URN =
  'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6a3R6a2Nub3I3dmw1bGdkOXZ6anUybXJ2ZXFzaG42d2x5MXdndHdqY3VhdXhyYjZkLWJhc2ljLWFwcC9zYWRlY2UlMjBldi5mYng'

onMounted(async () => {
  try {
    const response = await fetch('https://omran-production.up.railway.app/api/auth/token')
    const { access_token } = await response.json()

    const options = {
      env: 'AutodeskProduction',
      accessToken: access_token,
    }

    Autodesk.Viewing.Initializer(options, () => {
      const viewer = new Autodesk.Viewing.GuiViewer3D(viewerRef.value)
      viewer.start()

      Autodesk.Viewing.Document.load(
        `urn:${URN}`,
        (doc) => {
          const defaultModel = doc.getRoot().getDefaultGeometry()
          viewer.loadDocumentNode(doc, defaultModel)
        },
        (err) => {
          console.error('Document load error:', err)
        },
      )
    })
  } catch (error) {
    console.error('Error initializing Autodesk Viewer:', error)
  }
})
</script>
