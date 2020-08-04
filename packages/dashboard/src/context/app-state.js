import React, { useReducer, useMemo } from 'react'

const initialState = {
  ui: {
    leftSidebarOpen: false,
    appBarTitle: 'Home'
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
