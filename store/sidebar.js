export const state = () => ({
	aside_is_opened: false
})

export const getters = {
	isAsideOpen: state => state.aside_is_opened
}

export const mutations = {
	TOGGLE_SIDEBAR(state) { state.aside_is_opened = !state.aside_is_opened }
}

export const actions = {
	toggleSidebar({ commit }) {
		commit('TOGGLE_SIDEBAR')
	}
}
