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

    <!-- Viewer -->
    <div style="position: absolute; inset: 80px; border: 2px solid teal">
      <div ref="viewerRef" style="height: 100%; width: 100%"></div>
    </div>

    <!-- Debug info -->
    <div
      style="
        position: absolute;
        bottom: 10px;
        left: 10px;
        background: #fff;
        padding: 5px;
        border: 1px solid teal;
        font-size: 12px;
      "
    >
      Selected: {{ selectedMarkups.length }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const viewerRef = ref(null)
let markupsCoreButton = null // store MarkupsCore instance

// ✅ Reactive array
const selectedMarkups = ref([])

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
        let multiSelectEnabled = false
        const core = Autodesk.Viewing.Extensions.Markups.Core
        markupsCoreButton = markupsCore

        // Ctrl + Shift = multi-select mode
        window.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.shiftKey) multiSelectEnabled = true
        })
        window.addEventListener('keyup', (e) => {
          if (!e.ctrlKey || !e.shiftKey) multiSelectEnabled = false
        })

        // Disable interactions after creating a shape
        markupsCore.addEventListener(core.EVENT_EDITMODE_CHANGED, (ev) => {
          const editMode = ev.target
          if (!editMode) return
          editMode.addEventListener(core.EVENT_EDITMODE_CREATION_END, () => {
            markupsCore.disableMarkupInteractions(true)
          })
        })

        // Shape selection
        markupsCore.addEventListener(core.EVENT_MARKUP_SELECTED, (event) => {
          const pushedMarkup = event.target
          const index = selectedMarkups.value.findIndex((markup) => markup.id === pushedMarkup.id)

          if (multiSelectEnabled) {
            // ✅ Multi-select toggle logic
            if (index === -1) {
              if (!pushedMarkup.originalStyle) {
                pushedMarkup.originalStyle = { ...pushedMarkup.style }
              }
              selectedMarkups.value.push(pushedMarkup)
              pushedMarkup.setStyle({
                'stroke-color': '#00ff00',
                'stroke-width': 5,
                'fill-color': '#00ff00',
                'fill-opacity': 0.2,
              })
            } else {
              // Remove + reset style
              selectedMarkups.value.splice(index, 1)
              if (pushedMarkup.originalStyle) {
                pushedMarkup.setStyle(pushedMarkup.originalStyle)
              }
            }
          } else {
            // ✅ Single select logic
            if (index !== -1 && selectedMarkups.value.length === 1) {
              // Case: clicked the only selected element → deselect it
              selectedMarkups.value.splice(index, 1)
              if (pushedMarkup.originalStyle) {
                pushedMarkup.setStyle(pushedMarkup.originalStyle)
              }
            } else {
              // Case: clicked a new element OR there were multiple selected → clear all and keep only this one
              selectedMarkups.value.forEach((markup) => {
                if (markup.originalStyle) markup.setStyle(markup.originalStyle)
              })

              selectedMarkups.value = [pushedMarkup]

              if (!pushedMarkup.originalStyle) {
                pushedMarkup.originalStyle = { ...pushedMarkup.style }
              }
              pushedMarkup.setStyle({
                'stroke-color': '#00ff00',
                'stroke-width': 5,
                'fill-color': '#00ff00',
                'fill-opacity': 0.2,
              })
            }
          }

          console.log('Selected markups:', selectedMarkups.value)
        })
      })

      Autodesk.Viewing.Document.load(
        `urn:${URN}`,
        (doc) => {
          const defaultModel = doc.getRoot().getDefaultGeometry()
          viewer.loadDocumentNode(doc, defaultModel)
        },
        (err) => console.error('Document load error:', err),
      )
    })
  } catch (error) {
    console.error('Error initializing Autodesk Viewer:', error)
  }
})

// Switch to arrow tool
function startArrowDrawing() {
  if (!markupsCoreButton) return

  // Reset styles
  selectedMarkups.value.forEach((markup) => {
    if (markup.originalStyle) markup.setStyle(markup.originalStyle)
  })

  // Clear array (reactive)
  selectedMarkups.value = []
  console.log(selectedMarkups.value)

  markupsCoreButton.disableMarkupInteractions(true)
}

// Enable selecting shapes
function enableShapeEditing() {
  if (!markupsCoreButton) return
  markupsCoreButton.disableMarkupInteractions(false)
}
</script>
