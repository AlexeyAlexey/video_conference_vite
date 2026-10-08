// import fs from 'fs';

const fileRegex = /\.template\.(html\?tpl)$/

export default function templatePlugin() {
  return {
    name: 'template-loader-plugin',

    transform: {
      filter: {
        id: fileRegex,
      },
      handler(src, id) {
        return {
          code: `import { html as __escapeTemplate } from '@/escapeHtml.js';\nexport default function template(props = {}) {return __escapeTemplate\`${src}\`;};`,
          map: null, // provide source map if available
        }
      }
    }

  }
}

