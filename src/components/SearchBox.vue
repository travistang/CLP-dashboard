<template>
  <div class="search-box-container">
    <div class='search-box'>
      <div class='search-header'>
        Welcome, {{user.name}}
      </div>
      <div class="search-header">
        Choose where you want to go here
      </div>
      <div class="search-header"
        v-if="home && currentInputField"
        @click="chooseHomeAsInput"
      >
        Use Home as input
      </div>
      <div class="search-header"
        @click="chooseWorkAsInput"
        v-if="work && currentInputField">
        Use Work as input
      </div>
      <div class="search-input-col">
        <div class="search-input-title">
          From
        </div>
        <input
          @focus="() => changeFocus('from')"
          v-model="from"
          name="from"
          class="search-input"
          :disabled="disable"
        />
      </div>
      <div class="search-input-col">
        <div class="search-input-title">
          To
        </div>
        <input
          @focus="() => changeFocus('to')"
          v-model="to"
          name="to"
          class="search-input"
          :disabled="disable"
        />
      </div>

    </div>

    <div v-if="searchSuggestions.length > 0" class="search-result-box">
      <div
        @mouseover="() => setPreviewCandidate(s)"
        @mouseleave="() => setPreviewCandidate(null)"
        @click="() => selectSuggestion(s)"
        class="search-suggestion"
        :key="s.id"
        v-for="s in searchSuggestions">
        <div class="search-suggestion-name">
          {{s.name}}
        </div>
        <div class="search-suggestion-address">
          {{s.formatted_address}}
        </div>
      </div>
    </div>
    <div v-if="searchError != null" class="search-result-box">
      <div v-if="searchError == 'ZERO_RESULTS'" class="search-suggestion no-hover">
        No results found
      </div>
    </div>
    <div v-if="isSearching" class="search-result-box">
      <div class="search-suggestion no-hover">
        Searching...
      </div>
    </div>
  </div>
</template>

<script>
import {loaded} from 'vue2-google-maps'
export default {
  props: {
    user: {
      type: Object,
      default: () => ({
        'name': '',
        'email': '',
      })
    },
    home: {
      default: () => null,
    },
    work: {
      default: () => null,
    },
    selectedFrom: {
      default: () => null,
    },
    selectedTo: {
      default: () => null,
    },
    boundary: {
      type: Object,
      default: () => null
    },
    mapObject: {
      type: Object,
      default: () => null
    },
  },
  data() {
    return {
      from: "",
      to: "",

      timeoutOp: null,
      currentInputField: null,

      searchSuggestions: [],

      searchError: null,
      isSearching: false,

      // use this flag to indicate whether the change in input field is actually set by selecting a suggestion
      isSelectionSet: false,

      disable: false,
    }
  },
  watch:{
    from: function(){
      if(this.isSelectionSet) {
        this.isSelectionSet = false
        return
      }
      this.onInput()
    },
    to: function(){
      if(this.isSelectionSet) {
        this.isSelectionSet = false
        return
      }
      this.onInput()
    },

    searchSuggestions: function(v) {
      this.$emit('updateNameSearchCandidate',v)
    },

    selectedFrom: function(v) {
      this.isSelectionSet = true
      this.from = v.name
    },
    selectedTo: function(v) {
      this.isSelectionSet = true
      this.to = v.name
    },
  },
  methods: {
    chooseHomeAsInput() {
      this.resetState()
      this.isSelectionSet = true
      let emitMsgName = (this.currentInputField == 'from')? 'selectFrom':'selectTo'
      this.$emit(emitMsgName,this.home)
    },
    chooseWorkAsInput() {
      this.resetState()
      this.isSelectionSet = true
      let emitMsgName = (this.currentInputField == 'from')? 'selectFrom':'selectTo'
      this.$emit(emitMsgName,this.work)
    },
    selectSuggestion(s) {
      this.resetState()

      this.isSelectionSet = true
      // this[this.currentInputField] = s.name

      let loc = s.geometry.location
      let payload = {lat: loc.lat(),lng: loc.lng()}

      let emitMsgName = (this.currentInputField == 'from')? 'selectFrom':'selectTo'
      this.$emit(emitMsgName,payload)
    },
    resetState() {
      this.searchSuggestions = []
      this.isSearching = false
      this.searchError = null
    },
    searchPlaces() {
      // clear the results and give the loading spinner...
      this.resetState()
      this.isSearching = true
      // get the field value
      let input = this[this.currentInputField]
      if(this.mapObject) {
        new google.maps.places.PlacesService(this.mapObject).nearbySearch({
          name: input,
          radius: 10000,
          location: this.mapObject.getCenter()
        },(results,status) => {
          // no longer searching, set the searching flag accordingly
          this.isSearching = false
          if(status == 'OK'){
            this.searchSuggestions = results

          } else{
            this.searchSuggestions = []
            this.searchError = status
          }

          // notify parents about the change of name search candidates
          // this.$emit('updateNameSearchCandidate',this.searchSuggestions)
        })
      }
    },

    changeFocus(fieldName) {
      // reset the timer for throttling query duration
      this.currentInputField = fieldName
      this.searchSuggestions = []
      clearTimeout(this.timeoutOp)
    },
    onInput() {
      clearTimeout(this.timeoutOp)
      this.timeoutOp = setTimeout(() => {
        this.searchPlaces()
      },2000)
    },
    setPreviewCandidate(s) {
      if(s == null) {
        // unset the preview suggestion here
        this.$emit('previewCandidate',null)
        return
      }
      let loc = s.geometry.location
      let payload = {lat: loc.lat(),lng: loc.lng()}
      this.$emit('previewCandidate',payload)

    },
  },

  mounted: function() {

  },
}
</script>

<style>
.search-box-container {
  position: fixed;
  left: 24px;
  top: 24px;
  box-shadow: 1px 2px 2px rgba(0,0,0,0.3);
  background: white;
  z-index: 2000;
  display: flex;
  display: -webkit-flex;
  flex-direction: column;
}
.search-box {
  flex: 1;
  display: flex;
  display: -webkit-flex;
  flex-direction: column;
}
.search-result-box {
  flex: 1;
  display: flex;
  display: -webkit-flex;
  flex-direction: column;
}
.search-header {
  flex: 1 0 36px;
  text-align: center;
  display: flex;
  display: -webkit-flex;
  justify-content: center;
  align-items: center;
}
.search-input-col {
  flex: 1;
  border: none;
  height: 40px;
  border-bottom: 1px solid rgba(0,0,0,0.3);
  display: flex;
  display: -webkit-flex;
}
.search-input-title {
  flex: 1;
  text-transform: uppercase;
  display: flex;
  display: -webkit-flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 0px -4px  -4px black;
}
.search-input {
  flex: 5;
  /* height: 100%; */
  border: none;
}
.search-result-box {
  display: flex;
  display: -webkit-flex;
  flex: 1;
  flex-direction: column;
}
.search-suggestion {
  flex: 1;
  display: flex;
  display: -webkit-flex;
  justify-content: center;
  padding-top: 4px;
  padding-bottom: 4px;
  align-items: center;
  flex-direction: column;
  border-bottom: 1px solid rgba(0,0,0,0.1);

}
.search-suggestion:not(.no-hover):hover {
  color: white;
  background: grey;
}

.search-suggestion-name {
  flex: 1;

}
.search-suggestion-address {
  flex: 1;
  color: grey;
}
</style>
