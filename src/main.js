import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// CSS
import './assets/css/global.css'
import './assets/css/login.css'
import './assets/css/dashboard.css'
import './assets/css/project-add.css'
import './assets/css/project-detail.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
