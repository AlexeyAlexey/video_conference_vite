import { addNavigationBar } from '@/pages/navigationBar/addNavigationBar.js'
import { render } from '@/router'
import partialSharedLink from '@/pages/sharedLinks/_sharedLink.template.html?tpl'

export default function template(props = {}) {


  addNavigationBar({ pageName: 'sharedLinks' });
}