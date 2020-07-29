import { useContext } from 'react'

import AppStateContext from './context'

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
