<template>
  <div id="suggestion-window" :class="getSuggestionClass">
    <div class="close-btn" @click="$emit('setSuggested',null)">
      Close
    </div>
    <div class="header">
      Please select one of the following Bike Points
    </div>
    <div class="suggestion-container">
      <SuggestionCell v-for="s in suggestions"
        :suggestion="s"
        @click="selectItem(s)"
        :fromLatLng="fromLatLng"
        :isUnderPreview="previewSuggestion != null && previewSuggestion.id == s.id"
        @previewSuggestion="() => $emit('previewSuggestion',s)"
      />
    </div>
  </div>
</template>


<script>
import SuggestionCell from './SuggestionCell'
export default {
  components: {
    SuggestionCell,
  },
  props: {
    suggestions: {
      type: Array,
      required: true
    },
    fromLatLng: {
      type: Object,
      required: true
    },
    previewSuggestion: {
      default: () => null
    }
  },

  data() {
    return {
    }
  },
  computed: {
    getSuggestionClass: function() {
      if(this.suggestions.length == 0) return 'suggestion-hidden'
      return 'suggestion-main'
    }
  },
  methods: {
    selectItem(s) {
      this.$emit('setSuggested',s)
    }
  }
}
</script>

<style>
#suggestion-window {

  display: flex;
  display: -webkit-flex;
  flex-direction: column;
}
.header {
  display: flex;
  display: -webkit-flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid rgba(0,0,0,0.3);
  text-align: center;
  flex: 1;
}
.suggestion-container {
  padding: 8px;
}
.suggestion-main {
  height: 80%;
  width: 25%;
  background-color: white;
  box-shadow: 1px 4px 4px rgba(0,0,0,0.3);
  z-index: 2;
  position: absolute;
  right: 5%;
  top: 10%;
}
.suggestion-hidden {
  display: none;
}
.close-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  height: 24px;
  /* width: 24px; */
  color: white;
  z-index: 3;
  background-color: rgba(0,0,0,0.3);
  justify-content: center;
  align-items: center;
  display: flex;
}
</style>
