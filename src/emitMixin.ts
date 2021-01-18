import { setDevtoolsHook, ComponentPublicInstance } from 'vue'

const enum DevtoolsHooks {
  COMPONENT_EMIT = 'component:emit'
}

export const attachEmitListener = (vm: ComponentPublicInstance) => {
  let events: Record<string, unknown[]> = {}
  ;(vm as any).__emitted = events
  // use devtools capture this "emit"
  setDevtoolsHook(createDevTools(events))
}

function createDevTools(events) {
  const devTools: any = {
    emit(type, ...payload) {
      if (type !== DevtoolsHooks.COMPONENT_EMIT) return

      // The first argument is root component
      // The second argument is  vm
      // The third argument is event
      // The fourth argument is args of event
      recordEvent(events, payload[2], payload[3])
      wrapperWarn()
    }
  }

  return devTools
}

function recordEvent(events, event, args) {
  events[event]
    ? (events[event] = [...events[event], [...args]])
    : (events[event] = [[...args]])
}

// Vue will warn you if you emit an event that is not declared in `emits` and
// if the parent is not listening for that event.
// since we intercept the event, we are never listening for it explicitly on the
// Parent component. Swallow those events then restore the console.warn.
// TODO: find out if this is doable using `app.config.warnHandler` (does not appear
// work right now). https://github.com/vuejs/vue-test-utils-next/issues/197
function wrapperWarn() {
  const consoleWarnSave = console.warn
  console.warn = (msg: string, ...rest: unknown[]) => {
    if (msg.includes('[Vue warn]: Component emitted event')) {
      return
    } else {
      consoleWarnSave(msg, ...rest)
    }
  }
  console.warn = consoleWarnSave
}
