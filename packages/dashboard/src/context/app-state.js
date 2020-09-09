import React, { useReducer, useMemo } from 'react'

const getLocalStorage = (key) => {
  if (!window.localStorage) return false
  return (window.localStorage.getItem(key, false)) === 'true'
}

const setLocalStorage = (key, value) => {
  if (!window.localStorage) return
  window.localStorage.setItem(key, value)
}

const initialState = {
  ui: {
    leftSidebarOpen: false,
    appBarTitle: 'Home',
    darkMode: getLocalStorage('permanent-seeder.darkMode')
  }
}

function reducer (state, action) {
  const newState = { ...state }

  switch (action.type) {
    case 'ui.leftSidebar.open':
      newState.ui.leftSidebarOpen = action.payload
      break
    case 'ui.appBar.title':
      newState.ui.appBarTitle = action.payload
      break
    case 'ui.darkMode':
      setLocalStorage('permanent-seeder.darkMode', action.payload)
      newState.ui.darkMode = action.payload
      break
    default:
      throw new Error()
  }

  return newState
}

const AppStateContext = React.createContext()

export function AppStateProvider ({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const contextValue = useMemo(() => {
    return { state, dispatch }
  }, [state, dispatch])

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  )
}

export default AppStateContext
