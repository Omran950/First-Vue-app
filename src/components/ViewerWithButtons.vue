<template>
  <div style="width: 100%; height: 100vh; position: relative">
    <!-- Simple buttons to switch modes -->
    <div
      style="
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: center;
        margin-top: 20px;
      "
    >
      <button
        @click="startArrowDrawing"
        style="padding: 4px; border: 1px teal solid; border-radius: 5px; color: teal"
      >
        Draw Arrow
      </button>
      <button
        @click="enableShapeEditing"
        style="padding: 4px; border: 1px teal solid; border-radius: 5px; color: teal"
      >
        Select Shapes
      </button>
    </div>
    <div style="position: absolute; inset: 80px; border: 2px solid teal">
      <div ref="viewerRef" style="height: 100%; width: 100%"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const viewerRef = ref(null)
let markupsCoreButton = null // store MarkupsCore instance
const URN =
  'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6a3R6a2Nub3I3dmw1bGdkOXZ6anUybXJ2ZXFzaG42d2x5MXdndHdqY3VhdXhyYjZkLWJhc2ljLWFwcC9zYWRlY2UlMjBldi5mYng'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.type = 'module'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  try {
    await loadScript('/extensions/LoggerExtension.js')
    await loadScript('/extensions/SummaryExtension.js')
    await loadScript('/extensions/HistogramExtension.js')
    await loadScript('/extensions/DataGridExtension.js')

    const response = await fetch('https://omran-production.up.railway.app/api/auth/token')
    const { access_token } = await response.json()

    const options = {
      env: 'AutodeskProduction',
      accessToken: access_token,
      extensions: [
        'LoggerExtension',
        'SummaryExtension',
        'HistogramExtension',
        'DataGridExtension',
        'Autodesk.Viewing.MarkupsCore',
        'Autodesk.Viewing.MarkupsGui',
      ],
    }

    Autodesk.Viewing.Initializer(options, () => {
      const viewer = new Autodesk.Viewing.GuiViewer3D(viewerRef.value, options)
      viewer.start()

      viewer.loadExtension('Autodesk.Viewing.MarkupsCore').then((markupsCore) => {
        const core = Autodesk.Viewing.Extensions.Markups.Core
        markupsCoreButton = markupsCore

        markupsCore.addEventListener(core.EVENT_EDITMODE_CHANGED, (ev) => {
          const editMode = ev.target
          console.log(editMode)
          if (!editMode) return

          editMode.addEventListener(core.EVENT_EDITMODE_CREATION_END, (event) => {
            console.log(event, 'A markup has been created (any shape) — locking interactions now')
            // Disable all interactions with markups in Edit mode
            markupsCore.disableMarkupInteractions(true)
          })
        })
      })
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

// Switch to arrow tool without selecting existing shapes
function startArrowDrawing() {
  if (!markupsCoreButton) return
  markupsCoreButton.disableMarkupInteractions(true)
}

// Re-enable interactions to select/resize shapes
function enableShapeEditing() {
  if (!markupsCoreButton) return
  markupsCoreButton.disableMarkupInteractions(false)
}
</script>
