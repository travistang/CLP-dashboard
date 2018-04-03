<template>
  <div id="app">
    <!--
      from: the selected from location
      to: the selected to location
      boundary: the search boundary, no use right now
      mapObject: the mapObject required to initiate nearbySearch
      updateNameSearchCandidate: called when a list of locations matching the name of the inputed place has been changed
      previewCandidate: called when the user's cursor is on one of the name search candidates
      selectFrom: called when the user has clicked one of the name search candidates for `from`
      selectTo: similar to above, except it is for `to`
    -->
    <SearchBox
      :selectedFrom="from"
      :selectedTo="to"
      :boundary="searchBoundary"
      :mapObject="mapObject"
      @updateNameSearchCandidate="updateNameSearchCandidate"
      @previewCandidate="previewCandidate"
      @selectFrom="suggestFrom"
      @selectTo="suggestTo"
    />
    <!--
      center: center of map
      stations: list of BPs: no direct markers shown, see Map.vue for details
      suggestions: list of suggestions of BPs (when the from/to is confirmed): yellow marker with name of location
      nameSearchCandidates: list of candidates from a name search: blue marker with name of location
      from: called when the user has clicked on the info box `from` of a given location
      to: similar to above
      mapAcquired: called when the mapObject has been created, this is used in order to pass the map object to the search box for name search initialization
    -->
    <Map
      :center="previewCenter || suggestionFromLatLng || center"
      :stations="stations"
      :suggestions="suggestions"
      :nameSearchCandidates="nameSearchCandidates"
      :selectedFrom="from"
      :selectedTo="to"
      :previewSuggestion="previewSuggestion"
      @from="suggestFrom"
      @to="suggestTo"
      @mapAcquired="(map) => this.mapObject = map"
      @previewSuggestion="(s) => this.previewSuggestion = s"
      @selectSuggestion="(s) => this.setEndpoint(s)"
    />
    <!--
      suggestions: list of suggestions initiated by either name search or direct point search
      fromLatLng: the location where the user has chosen, either a geocode of the selected name search candidate or a direct right click on the map
      setSuggested: called when a selection has been choosen
    -->
    <Suggestions
      v-if="suggestions.length > 0"
      :suggestions="suggestions"
      :fromLatLng="suggestionFromLatLng"
      :previewSuggestion="previewSuggestion"
      @setSuggested="setEndpoint"
      @previewSuggestion="(s) => this.previewSuggestion = s"
    />
  </div>
</template>

<script>
import Vue from 'vue'
import Map from './components/Map'
import SearchBox from './components/SearchBox'
import Suggestions from './components/suggestions/Suggestions'
export default {
  name: 'app',
  components: {
    Map,
    Suggestions,
    SearchBox,
  },
  data () {
    return {
      stations: [],

      // the following two are latLngs, NOT stations
      from: null,
      to: null,

      // just a placeholder, can be whatever
      center: {lat: 0, lng: 0},

      // the latLng where the suggestion is around with
      suggestionFromLatLng: null,
      suggestFor: null,

      nbSuggestions: 5,

      mapObject: null,

      previewCenter: null,
      nameSearchCandidates: [],

      previewSuggestion: null,
    }
  },
  watch: {
    from: function(v) {
      if (v && this.to) {
        // clear suggestions if both directions are set
        this.suggestions = []
      }
    },
    to: function(v) {
      if (v && this.from) {
        // clear suggestions if both directions are set
        this.suggestions = []
      }
    }
  },
  methods: {
    updateNameSearchCandidate(candidates) {
      this.nameSearchCandidates = candidates
    },
    previewCandidate(candidate) {
      this.previewCenter = candidate
    },
    setEndpoint(bpObj) {
      if(bpObj == null) {
        this.suggestionFromLatLng = null
        return
      }
      if(this.suggestFor == 'from') {
        this.from = bpObj
      } else {
        this.to = bpObj
      }
      // no more suggestions
      console.log('resetting suggestions')
      this.suggestionFromLatLng = null
    },
    fetchStations() {
      let getPropertiesValue = (bp,key) => {
        let res = bp.additionalProperties.filter(p => p.key == key)
        if(res) return Number(res[0].value)
        return null
      }
      return fetch("https://api.tfl.gov.uk/bikepoint")
        .then(data => data.json())
        .then(data => data.map(bp => ({
            name: bp.commonName,
            latLng: {lat: bp.lat,lng: bp.lon},
            id: bp.id,
            nbBikes: getPropertiesValue(bp,"NbBikes"),
            nbEmptyDocks: getPropertiesValue(bp,"NbEmptyDocks"),
            nbDocks: getPropertiesValue(bp,"NbDocks")
          })))
        .then(bpList => {
          this.stations = bpList
          // this.setStations(bpList)
        })
    },
    suggestFrom(bp){
      this.suggestionFromLatLng = bp
      this.suggestFor = 'from'
      this.center = this.suggestionFromLatLng
    },
    suggestTo(bp) {
      this.suggestionFromLatLng = bp
      this.suggestFor = 'to'
      this.center = this.suggestionFromLatLng
    },
    setMapPreviewLocation(previewCenter) {
      this.previewCenter = previewCenter
    },
    setCenter(lat = 51.507720, lng = -0.085613) {
      this.center = {lat,lng}
    },

    selectSuggestion(suggestFor,s) {
      this.suggestFor = suggestFor
      this.center = s
      this.suggestionFromLatLng = s
    }

  },
  computed: {
    suggestions: function() {
      if (this.suggestionFromLatLng == null || this.stations.length == 0) {
        return []
      }
      let distFunc = s => Math.pow(s.latLng.lat - this.suggestionFromLatLng.lat,2) + Math.pow(s.latLng.lng - this.suggestionFromLatLng.lng,2)
      // TODO: filter this according selection points (from/to)
      let res = this.stations.sort((s1,s2) => distFunc(s1) - distFunc(s2)).slice(0,this.nbSuggestions)
      return res
    },
    searchBoundary: function() {
      if(this.suggestions.length == []) return null
      let latLngs = this.suggestions.map(s => new google.maps.LatLng(s.latLng.lat,s.latLng.lng))
      let res = latLngs.reduce((bound,latlng) => bound.extend(latlng),new google.maps.LatLngBounds())
      return res
    }
  },
  mounted: function() {
    this.setCenter()
    setInterval(this.fetchStations,30000)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        this.setCenter()
        // this.setCenter(position.coords.latitude,position.coords.longitude)
      },err => {
        this.setCenter()
      })

    }else {
      this.setCenter()
    }
  }
}
</script>

<style>
body {

}
#app {
  font-family: 'HelveticaNeue-Light';
  position: fixed;
  height: 100%;
  width: 100%;
  left: 0px;
  right: 0px;
}

</style>
