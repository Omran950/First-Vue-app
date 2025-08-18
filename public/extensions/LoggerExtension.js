import { BaseExtension } from './BaseExtension.js'

class LoggerExtension extends BaseExtension {
  load() {
    super.load()
    return true
  }

  unload() {
    super.unload()
    return true
  }

  async onModelLoaded(model) {
    super.onModelLoaded(model)
    const props = await this.findPropertyNames(this.viewer.model)
  }

  async onSelectionChanged(model, dbids) {
    super.onSelectionChanged(model, dbids)
  }

  onIsolationChanged(model, dbids) {
    super.onIsolationChanged(model, dbids)
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension('LoggerExtension', LoggerExtension)
