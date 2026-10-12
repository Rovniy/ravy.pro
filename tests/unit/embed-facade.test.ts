// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { onMounted } from 'vue'
import EmbedFacade from '../../components/ui/EmbedFacade.vue'

const props = { src: 'https://open.spotify.com/embed/album/abc', title: 'Album on Spotify', event: 'music_play' as const }

function mountFacade() {
  const track = vi.fn()
  vi.stubGlobal('onMounted', onMounted)
  vi.stubGlobal('useAnalytics', () => ({ track }))
  const wrapper = mount(EmbedFacade, { props, global: { stubs: { Icon: true } } })
  return { wrapper, track }
}

describe('<UiEmbedFacade>', () => {
  it('renders no iframe until played', () => {
    const { wrapper } = mountFacade()
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  // Same invariants the studio enforces on post embeds.
  it('loads a titled iframe without a fixed size on click and tracks it', async () => {
    const { wrapper, track } = mountFacade()
    await wrapper.find('button').trigger('click')
    const iframe = wrapper.find('iframe')
    expect(iframe.attributes('title')).toBe(props.title)
    expect(iframe.attributes('width')).toBeUndefined()
    expect(iframe.attributes('height')).toBeUndefined()
    expect(iframe.attributes('src')).toBe(`${props.src}?autoplay=1`)
    expect(track).toHaveBeenCalledWith('music_play', {})
  })
})
