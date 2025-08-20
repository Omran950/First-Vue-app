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
      <button
        @click="debugSelectedMarkups"
        :disabled="selectedMarkups.length === 0"
        style="
          padding: 4px;
          border: 1px orange solid;
          border-radius: 5px;
          color: orange;
          background: white;
        "
        :style="{ opacity: selectedMarkups.length === 0 ? 0.5 : 1 }"
      >
        Debug Selected
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
let markupsCoreButton = null // store MarkupsCore instance
let viewer = null // store viewer instance

// ✅ Reactive array
const selectedMarkups = ref([])
const statusMessage = ref('')

// Computed properties for saved markups
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
  const saved = localStorage.getItem('savedMarkups')
  return saved || null // plain string, not JSON
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
    console.log('Saved SVG:', svg)
  }
}

// Helper function to extract complete markup data
function extractCompleteMarkupData(markup) {
  const completeData = {
    // Core identification
    id: markup.id,
    type: markup.type || markup.constructor?.name,

    // Visual properties
    style: extractSerializableObject(markup.style),

    // Geometric properties
    position: extractSerializableObject(markup.position),
    size: extractSerializableObject(markup.size),
    rotation: markup.rotation,

    // Specific shape data
    points: markup.points ? extractSerializableArray(markup.points) : null,
    width: markup.width,
    height: markup.height,
    radius: markup.radius,
    text: markup.text,

    // Try to capture all enumerable properties
    allProperties: {},
  }

  // Attempt to capture ALL enumerable properties safely
  try {
    for (const key in markup) {
      if (markup.hasOwnProperty && markup.hasOwnProperty(key)) {
        const value = markup[key]

        // Skip functions, DOM elements, and circular references
        if (
          typeof value === 'function' ||
          value instanceof Node ||
          value instanceof Window ||
          value === window ||
          key.includes('element') ||
          key.includes('viewer') ||
          key.includes('parent')
        ) {
          continue
        }

        try {
          // Test if we can serialize this property
          JSON.stringify(value)
          completeData.allProperties[key] = value
        } catch (circularError) {
          // If it's a complex object, try to extract safe parts
          if (typeof value === 'object' && value !== null) {
            completeData.allProperties[key] = extractSerializableObject(value)
          } else {
            completeData.allProperties[key] = String(value) // Convert to string as fallback
          }
        }
      }
    }
  } catch (error) {
    console.log('Error extracting all properties:', error.message)
  }

  // Try to get the raw SVG data if available
  try {
    if (markup.generateData) {
      completeData.svgData = markup.generateData()
    }
  } catch (error) {
    console.log('Could not extract SVG data')
  }

  // Remove empty objects/arrays
  Object.keys(completeData).forEach((key) => {
    const value = completeData[key]
    if (
      value === null ||
      value === undefined ||
      (typeof value === 'object' && Object.keys(value).length === 0) ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete completeData[key]
    }
  })

  return completeData
}

// Helper to safely extract object properties
function extractSerializableObject(obj) {
  if (!obj || typeof obj !== 'object') return obj

  const safe = {}
  try {
    for (const key in obj) {
      if (obj.hasOwnProperty && obj.hasOwnProperty(key)) {
        const value = obj[key]

        // Skip problematic values
        if (
          typeof value === 'function' ||
          value instanceof Node ||
          value instanceof Window ||
          value === window
        ) {
          continue
        }

        try {
          JSON.stringify(value) // Test serializability
          safe[key] = value
        } catch (error) {
          // Convert to string as fallback
          safe[key] = String(value)
        }
      }
    }
  } catch (error) {
    console.log('Error extracting object:', error.message)
  }

  return Object.keys(safe).length > 0 ? safe : null
}

// Helper to safely extract array properties
function extractSerializableArray(arr) {
  if (!Array.isArray(arr)) return arr

  return arr
    .map((item) => {
      if (typeof item === 'object' && item !== null) {
        return extractSerializableObject(item)
      }
      return item
    })
    .filter((item) => item !== null && item !== undefined)
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

// Function to recreate a markup from saved data
async function recreateMarkup(markupData) {
  const core = Autodesk.Viewing.Extensions.Markups.Core

  console.log('Recreating markup:', markupData)

  // Try different approaches based on what data we have
  if (markupData.svgData) {
    // Method 1: Try to use SVG data if available
    try {
      return await recreateFromSVG(markupData)
    } catch (error) {
      console.log('SVG recreation failed, trying other methods')
    }
  }

  // Method 2: Try to recreate based on type and properties
  return await recreateFromProperties(markupData)
}

// Recreate from SVG data
async function recreateFromSVG(markupData) {
  try {
    // Try loading the SVG markup directly
    const success = markupsCoreButton.loadMarkups(markupData.svgData, 'svg')
    if (success) {
      console.log('Successfully loaded from SVG')
      return true
    }
  } catch (error) {
    console.error('SVG loading failed:', error)
  }
  return false
}

// Recreate from extracted properties
async function recreateFromProperties(markupData) {
  const core = Autodesk.Viewing.Extensions.Markups.Core

  try {
    // Determine markup type and create appropriate tool
    let toolType = getToolTypeFromMarkupData(markupData)

    if (!toolType) {
      console.log('Unknown markup type:', markupData.type)
      return false
    }

    // Create edit mode for the specific tool
    const editMode = markupsCoreButton.getEditMode()

    if (!editMode) {
      console.error('Edit mode not available')
      return false
    }

    // Try to set the tool type
    const tool = editMode.getTools()[toolType]
    if (!tool) {
      console.log('Tool not found:', toolType)
      return false
    }

    // Set the tool as active
    editMode.setTool(tool)

    // Try to create markup programmatically using the saved data
    return await createMarkupProgrammatically(markupData, editMode, tool)
  } catch (error) {
    console.error('Error recreating from properties:', error)
    return false
  }
}

// Map saved markup data to tool types
function getToolTypeFromMarkupData(markupData) {
  const type = markupData.type || ''
  const allProps = markupData.allProperties || {}

  // Map based on type or properties
  if (type.includes('Arrow') || allProps.hasArrowHead) {
    return 'arrow'
  } else if (type.includes('Rectangle') || (markupData.width && markupData.height)) {
    return 'rectangle'
  } else if (type.includes('Circle') || markupData.radius) {
    return 'circle'
  } else if (type.includes('Polyline') || markupData.points) {
    return 'polyline'
  } else if (type.includes('Text') || markupData.text) {
    return 'text'
  } else if (type.includes('Callout')) {
    return 'callout'
  } else if (type.includes('Cloud')) {
    return 'cloud'
  }

  return null
}

// Create markup programmatically
async function createMarkupProgrammatically(markupData, editMode, tool) {
  try {
    // This is the tricky part - different markup types need different approaches
    // For now, let's try a generic approach

    const style = markupData.style || {}
    const position = markupData.position || markupData.allProperties?.position || {}
    const size = markupData.size || {}

    // Apply style if available
    if (Object.keys(style).length > 0) {
      const styleManager = editMode.getStyleManager()
      if (styleManager) {
        Object.keys(style).forEach((key) => {
          try {
            styleManager.setStyle(key, style[key])
          } catch (error) {
            console.log('Could not set style:', key, style[key])
          }
        })
      }
    }

    // Try to create the markup based on available data
    if (markupData.points && markupData.points.length >= 2) {
      // For line-based markups (arrows, polylines)
      return await createLineBasedMarkup(markupData, editMode, tool)
    } else if (position.x !== undefined && position.y !== undefined) {
      // For position-based markups
      return await createPositionBasedMarkup(markupData, editMode, tool)
    }

    console.log('Could not determine how to recreate markup:', markupData)
    return false
  } catch (error) {
    console.error('Error in createMarkupProgrammatically:', error)
    return false
  }
}

// Create line-based markups (arrows, polylines)
async function createLineBasedMarkup(markupData, editMode, tool) {
  try {
    const points = markupData.points
    if (!points || points.length < 2) return false

    // Simulate mouse events to create the markup
    const startPoint = points[0]
    const endPoint = points[points.length - 1]

    // Create mock mouse events
    const startEvent = {
      type: 'mousedown',
      clientX: startPoint.x || startPoint[0],
      clientY: startPoint.y || startPoint[1],
      canvasX: startPoint.x || startPoint[0],
      canvasY: startPoint.y || startPoint[1],
    }

    const endEvent = {
      type: 'mouseup',
      clientX: endPoint.x || endPoint[0],
      clientY: endPoint.y || endPoint[1],
      canvasX: endPoint.x || endPoint[0],
      canvasY: endPoint.y || endPoint[1],
    }

    // Try to trigger the tool's creation process
    if (tool.handleMouseDown) {
      tool.handleMouseDown(startEvent)

      // Add intermediate points for polylines
      if (points.length > 2) {
        for (let i = 1; i < points.length - 1; i++) {
          const point = points[i]
          const moveEvent = {
            type: 'mousemove',
            clientX: point.x || point[0],
            clientY: point.y || point[1],
            canvasX: point.x || point[0],
            canvasY: point.y || point[1],
          }
          if (tool.handleMouseMove) {
            tool.handleMouseMove(moveEvent)
          }
        }
      }

      if (tool.handleMouseUp) {
        tool.handleMouseUp(endEvent)
      }

      return true
    }

    return false
  } catch (error) {
    console.error('Error creating line-based markup:', error)
    return false
  }
}

// Create position-based markups (rectangles, circles)
async function createPositionBasedMarkup(markupData, editMode, tool) {
  try {
    const position = markupData.position || markupData.allProperties?.position || {}
    const size = markupData.size || {}

    const x = position.x || 100
    const y = position.y || 100
    const width = size.width || markupData.width || 50
    const height = size.height || markupData.height || 50

    // Create start and end points for rectangle/circle creation
    const startEvent = {
      type: 'mousedown',
      clientX: x,
      clientY: y,
      canvasX: x,
      canvasY: y,
    }

    const endEvent = {
      type: 'mouseup',
      clientX: x + width,
      clientY: y + height,
      canvasX: x + width,
      canvasY: y + height,
    }

    if (tool.handleMouseDown && tool.handleMouseUp) {
      tool.handleMouseDown(startEvent)
      tool.handleMouseUp(endEvent)
      return true
    }

    return false
  } catch (error) {
    console.error('Error creating position-based markup:', error)
    return false
  }
}

// Clear saved markups
function clearSavedMarkups() {
  clearMarkupsFromStorage()
  showStatus('Cleared saved markups')
}

// Debug function to inspect markup objects
function debugSelectedMarkups() {
  if (selectedMarkups.value.length === 0) return

  console.log('=== DEBUGGING SELECTED MARKUPS ===')
  selectedMarkups.value.forEach((markup, index) => {
    console.log(`\n--- Markup ${index + 1} ---`)
    console.log('Full object:', markup)
    console.log('Object keys:', Object.keys(markup))
    console.log('Constructor:', markup.constructor?.name)
    console.log('Type:', markup.type)
    console.log('ID:', markup.id)

    // Try to see what methods are available
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(markup)))

    // Show extracted data
    const extracted = extractCompleteMarkupData(markup)
    console.log('Extracted data:', extracted)
  })
}

// Auto-load markups when viewer is ready
function autoLoadMarkups() {
  const savedMarkups = getSavedMarkupsFromStorage()
  if (savedMarkups.length > 0) {
    setTimeout(() => {
      loadSavedMarkups()
    }, 1000) // Small delay to ensure viewer is fully ready
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
          console.log(markupsCore.getSelection())
          console.log('Selected markups:', selectedMarkups.value)
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
