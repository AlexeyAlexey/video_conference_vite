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
          code: `export default function template(props = {}) {return \`${src}\`;};`,
          map: null, // provide source map if available
        }
      }
    }

  }
}

