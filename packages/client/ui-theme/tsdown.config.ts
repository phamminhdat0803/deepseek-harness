import { clientBundle } from '../tsdown.client.ts'

export default clientBundle(
  '@deepseek-ai/dsh-client-ui-theme',
  ['lib/types/index.js'],
  {
    lib: {
      copy: [
        {
          from: 'src/styles/{brand-font.css,montserrat-*.woff2,Montserrat-OFL.txt}',
          to: 'lib/styles',
        },
        {
          from: 'src/styles/{ui-font.css,inter-*.woff2,geist-mono-*.woff2,Inter-OFL.txt,Geist-Mono-OFL.txt}',
          to: 'lib/styles',
        },
      ],
    },
  },
)
