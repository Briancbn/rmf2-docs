import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "RMF-Industrial",
  description: "RMF2 Documentation",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: "RMF Industrial",
    nav: [
      { text: 'Guide', link: '/guide/what-is-rmf2' },
      { text: 'References', link: '/references/overview' },
    ],

    sidebar: {
      // Sidebar config for `guide` directory
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is RMF-Industrial?', link: '/guide/what-is-rmf2' },
            { text: 'Getting Started', link: '/guide/getting-started' },
          ]
        },
        {
          text: 'Guide',
          items: [
          ]
        },
        {
          text: 'Module Documentation',
          items: [
          ]
        },
        { text: 'Config & API References', link: '/references/overview' },
      ],
      '/references': [
          { text: 'Overview', link: '/references/overview' },
          { text: 'VDA5050 Core', link: '/references/vda5050_core' },
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ros-industrial/rmf_industrial' }
    ]
  },
  markdown: {
    config(md) {
      md.use(groupIconMdPlugin)
    },
  },
  vite: {
    plugins: [
      groupIconVitePlugin()
    ],
  }
})
