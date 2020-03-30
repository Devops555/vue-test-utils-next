import { nextTick } from 'vue'

import { WrapperAPI } from './types'
import { ErrorWrapper } from './error-wrapper'

export class DOMWrapper<ElementType extends Element> implements WrapperAPI {
  element: ElementType

  constructor(element: ElementType) {
    this.element = element
  }

  classes(className?) {
    const classes = this.element.classList

    if (className) return classes.contains(className)

    return Array.from(classes)
  }

  attributes(key?: string) {
    const attributes = this.element.attributes
    const attributeMap = {}
    for (let i = 0; i < attributes.length; i++) {
      const att = attributes.item(i)
      attributeMap[att.localName] = att.value
    }

    return key ? attributeMap[key] : attributeMap
  }

  exists() {
    return true
  }

  text() {
    return this.element.textContent?.trim()
  }

  html() {
    return this.element.outerHTML
  }

  find<T extends Element>(selector: string): DOMWrapper<T> | ErrorWrapper {
    const result = this.element.querySelector<T>(selector)
    if (result) {
      return new DOMWrapper<T>(result)
    }

    return new ErrorWrapper({ selector })
  }

  findAll<T extends Element>(selector: string): DOMWrapper<T>[] {
    return Array.from(this.element.querySelectorAll<T>(selector)).map(
      (x) => new DOMWrapper(x)
    )
  }

  async setChecked(checked: boolean = true) {
    // typecast so we get typesafety
    const element = (this.element as unknown) as HTMLInputElement
    const type = this.attributes().type

    if (element.tagName !== 'INPUT') {
      throw Error(
        `You need to call setChecked on an input element. You called it on a ${this.element.tagName}`
      )
    }

    if (type === 'radio' && !checked) {
      throw Error(
        `wrapper.setChecked() cannot be called with parameter false on a '<input type="radio" /> element.`
      )
    }

    // we do not want to trigger an event if the user
    // attempting set the same value twice
    // this is beacuse in a browser setting checked = true when it is
    // already true is a no-op; no change event is triggered
    if (checked === element.checked) {
      return
    }

    element.checked = checked
    return this.trigger('change')
  }

  setValue(value?: any) {
    const element = (this.element as unknown) as HTMLInputElement
    const tagName = element.tagName
    const type = this.attributes().type

    if (tagName === 'OPTION') {
      return this.setSelected()
    } else if (tagName === 'INPUT' && type === 'checkbox') {
      return this.setChecked()
    } else if (tagName === 'INPUT' && type === 'radio') {
      return this.setChecked()
    } else if (
      tagName === 'INPUT' ||
      tagName === 'TEXTAREA' ||
      tagName === 'SELECT'
    ) {
      element.value = value

      if (tagName === 'SELECT') {
        return this.trigger('change')
      }
      this.trigger('input')

      // for v-model.lazy, we need to trigger a change event, too.
      // $FlowIgnore
      // if (
      //   (tagName === 'INPUT' || tagName === 'TEXTAREA') && element._vModifiers && element._vModifiers.lazy
      // ) {
      //   return this.trigger('change')
      // }
      return nextTick
    } else {
      throw Error(`wrapper.setValue() cannot be called on this element`)
    }
  }

  setSelected() {
    const element = (this.element as unknown) as HTMLOptionElement
    const tagName = element.tagName

    if (tagName === 'SELECT') {
      throw Error(
        `wrapper.setSelected() cannot be called on select. Call it on one of its options`
      )
    }

    if (tagName === 'OPTION') {
      if (element.selected) {
        return
      }

      element.selected = true
      let parentElement = element.parentElement

      if (parentElement.tagName === 'OPTGROUP') {
        parentElement = parentElement.parentElement
      }

      return new DOMWrapper(parentElement).trigger('change')
    }

    throw Error(`wrapper.setSelected() cannot be called on this element`)
  }

  async trigger(eventString: string) {
    const evt = document.createEvent('Event')
    evt.initEvent(eventString)

    if (this.element) {
      this.element.dispatchEvent(evt)
      return nextTick
    }
  }
}
