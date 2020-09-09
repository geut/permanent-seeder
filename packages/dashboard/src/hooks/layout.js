import { useContext, useMemo } from 'react'

import AppStateContext from '../context/app-state'

export function useLeftSidebar () {
  const { state: { ui: { leftSidebarOpen } }, dispatch } = useContext(AppStateContext)

  const setLeftSidebarOpen = (open = true) => {
    dispatch({ type: 'ui.leftSidebar.open', payload: open })
  }

  return [
    leftSidebarOpen,
    setLeftSidebarOpen
  ]
}

export function useAppBarTitle () {
  const { state: { ui: { appBarTitle } }, dispatch } = useContext(AppStateContext)

  const setAppBarTitle = useMemo(() => title => {
    dispatch({ type: 'ui.appBar.title', payload: title })
  }, [dispatch])

  return [
    appBarTitle,
    setAppBarTitle
  ]
}

export function useDarkMode () {
  const { state: { ui: { darkMode } }, dispatch } = useContext(AppStateContext)

  const setDarkMode = (dark) => {
    dispatch({ type: 'ui.darkMode', payload: dark })
  }

  return [
    darkMode,
    setDarkMode
  ]
}
