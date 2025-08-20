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
        flex-wrap: wrap;
      "
    >
      <button
        @click="startArrowDrawing"
        style="padding: 4px; border: 1px teal solid; border-radius: 5px; color: teal"
      >
        Draw Arrow
      </button>
      <button
        @click="clearSavedMarkups"
        :disabled="!hasSavedMarkups"
        style="
          padding: 4px;
          border: 1px red solid;
          border-radius: 5px;
          color: red;
          background: white;
        "
        :style="{ opacity: !hasSavedMarkups ? 0.5 : 1 }"
      >
        Clear Saved
      </button>
      <button
        @click="enableShapeEditing"
        style="padding: 4px; border: 1px teal solid; border-radius: 5px; color: teal"
      >
        Select Shapes
      </button>
      <button
        @click="saveSelectedMarkups"
        :disabled="selectedMarkups.length === 0"
        style="
          padding: 4px;
          border: 1px green solid;
          border-radius: 5px;
          color: green;
          background: white;
        "
        :style="{ opacity: selectedMarkups.length === 0 ? 0.5 : 1 }"
      >
        Save Selected ({{ selectedMarkups.length }})
      </button>
      <button
        @click="loadSavedMarkups"
        :disabled="!hasSavedMarkups"
        style="
          padding: 4px;
          border: 1px blue solid;
          border-radius: 5px;
          color: blue;
          background: white;
        "
        :style="{ opacity: !hasSavedMarkups ? 0.5 : 1 }"
      >
        Load Saved Markups
      </button>
    </div>

    <!-- Viewer -->
    <div style="position: absolute; inset: 80px; border: 2px solid teal">
      <div ref="viewerRef" style="height: 100%; width: 100%"></div>
    </div>

    <!-- Status info -->
    <div
      style="
        position: absolute;
        bottom: 10px;
        left: 10px;
        background: #fff;
        padding: 5px;
        border: 1px solid teal;
        font-size: 12px;
        max-width: 300px;
      "
    >
      <div>Selected: {{ selectedMarkups.length }}</div>
      <div v-if="hasSavedMarkups">Saved markups available: {{ savedMarkupsCount }}</div>
      <div v-if="statusMessage" style="color: green; margin-top: 5px">{{ statusMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'

const viewerRef = ref(null)
let markupsCoreButton = null
let viewer = null

const selectedMarkups = ref([])
const statusMessage = ref('')

const hasSavedMarkups = computed(() => {
  const saved = getSavedMarkupsFromStorage()
  return saved && saved.length > 0
})

const savedMarkupsCount = computed(() => {
  const saved = getSavedMarkupsFromStorage()
  return saved ? saved.length : 0
})

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

// Persistence functions
function getSavedMarkupsFromStorage() {
  return localStorage.getItem('savedMarkups')
}

function saveMarkupsToStorage(svgString) {
  try {
    localStorage.setItem('savedMarkups', svgString)
    return true
  } catch (error) {
    console.error('Error saving markups to storage:', error)
    return false
  }
}

function clearMarkupsFromStorage() {
  localStorage.removeItem('savedMarkups')
}

// Save selected markups
function saveSelectedMarkups() {
  if (!markupsCoreButton) return

  const svg = markupsCoreButton.generateData()
  if (saveMarkupsToStorage(svg)) {
    showStatus('Markups saved successfully!')
  }
}

// Load saved markups
function loadSavedMarkups() {
  if (!markupsCoreButton) return

  const svg = getSavedMarkupsFromStorage()
  if (!svg) {
    showStatus('No saved markups found')
    return
  }

  markupsCoreButton.enterEditMode()
  markupsCoreButton.loadMarkups(svg, 'myLayer')
  markupsCoreButton.leaveEditMode()

  showStatus('Markups loaded!')
}

// Clear saved markups
function clearSavedMarkups() {
  clearMarkupsFromStorage()
  showStatus('Cleared saved markups')
}

// Auto-load markups when viewer is ready
function autoLoadMarkups() {
  const savedMarkups = getSavedMarkupsFromStorage()
  if (savedMarkups && savedMarkups.length > 0) {
    setTimeout(() => {
      loadSavedMarkups()
    }, 1000)
  }
}

// Show temporary status message
function showStatus(message) {
  statusMessage.value = message
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
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
      viewer = new Autodesk.Viewing.GuiViewer3D(viewerRef.value, options)
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
            // Multi-select toggle logic
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
            // Single select logic
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
        })
      })

      Autodesk.Viewing.Document.load(
        `urn:${URN}`,
        (doc) => {
          const defaultModel = doc.getRoot().getDefaultGeometry()
          viewer.loadDocumentNode(doc, defaultModel).then(() => {
            // Auto-load saved markups after the model is loaded
            autoLoadMarkups()
          })
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

  // Clear array
  selectedMarkups.value = []

  markupsCoreButton.disableMarkupInteractions(true)
}

// Enable selecting shapes
function enableShapeEditing() {
  if (!markupsCoreButton) return
  markupsCoreButton.disableMarkupInteractions(false)
}
</script>
