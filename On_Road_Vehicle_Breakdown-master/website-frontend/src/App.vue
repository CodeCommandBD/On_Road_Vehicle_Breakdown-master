<template>
  <div id="app">
    <RoadNav />
    <HeroArea />
  </div>
</template>

<script>
import RoadNav from './components/RoadNav.vue'
import HeroArea from './components/HeroArea.vue'

export default {
  name: 'App',
  components: {
    RoadNav,
    HeroArea
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
