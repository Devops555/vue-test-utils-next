import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import flow from 'lodash/flow'

export const pascalCase = flow(camelCase, upperFirst)
