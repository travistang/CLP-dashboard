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
      :username="user"
      :favourites="favourites"

      :selectedFrom="from"
      :selectedTo="to"
      :boundary="searchBoundary"
      :mapObject="mapObject"
      :home="home"
      :work="work"
      @updateNameSearchCandidate="updateNameSearchCandidate"
      @previewCandidate="previewCandidate"
      @selectFrom="suggestFrom"
      @selectTo="suggestTo"

      @selectFavouriteFrom="selectFavouriteFrom"
      @selectFavouriteTo="selectFavouriteTo"
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
      :isLoggedIn="isLoggedIn"
      :center="previewCenter || suggestionFromLatLng || center"
      :stations="stations"
      :suggestions="suggestions"
      :favourites="favourites"
      :nameSearchCandidates="nameSearchCandidates"
      :selectedFrom="from"
      :selectedTo="to"
      :previewSuggestion="previewSuggestion"
      @from="suggestFrom"
      @to="suggestTo"
      @mapAcquired="(map) => this.mapObject = map"
      @previewSuggestion="(s) => this.previewSuggestion = s"
      @selectSuggestion="(s) => this.setEndpoint(s)"
      @markLocation="markLocation"
      @toggleFavourite="toggleFavourite"
      @setHome="setHome"
      @setWork="setWork"
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
// import {parseToken} from './utils'
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
      endpointURL: 'http://ec2-18-188-140-23.us-east-2.compute.amazonaws.com',
      username: null,

      // the following two are latLngs, NOT stations
      from: null,
      to: null,

      // favourite point
      home: null,
      work: null,
      favourites: [],

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
    setHome(loc) {
      let patchPayload = Object.assign({},{
        starred: this.favourites,
        home: loc,
        work: this.work,
        user: this.user,
      })
      return this.patchData(patchPayload)
    },
    setWork(loc) {
      let patchPayload = Object.assign({},{
        starred: this.favourites,
        home: this.home,
        work: loc,
        user: this.user,
      })
      return this.patchData(patchPayload)
    },
    selectFavouriteTo(station) {
      this.to = station
    },
    selectFavouriteFrom(station) {
      this.from = station
    },
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
    },

    markLocation(type,latlng) {
      // TODO: set home, work here

    },
    // update user favourites / home / work with this method
    patchData(data) {
      return fetch(`${this.endpointURL}/favourite/${this.username}`,{
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).then(response => {
        if(response.status != 404) {
          return response.json()
            .then(data => {
              this.favourites = data.starred
              this.home = data.home
              this.work = data.work
              this.username = data._id
            })
        }
      })
    },
    // given a station object, mark it as favourite / remove from favourite
    toggleFavourite(station) {
      // make a null / undefined favourites an empty array
      if(!this.favourites) this.favourites = []
      if(this.favourites.filter(s => s.id == station.id).length > 0) {
        // remove from favourite
        let patchPayload = Object.assign({},{
          // take out this particular station
          starred: this.favourites.filter(s => s.id != station.id),
          home: this.home,
          work: this.work,
          user: this.user,
        })
        return this.patchData(patchPayload)

      } else {
        let patchPayload = Object.assign({},{
          starred: this.favourites.concat(station),
          home: this.home,
          work: this.work,
          user: this.user,
        })
        return this.patchData(patchPayload)
      }
    },


    // Endpoint Functions
    // get id from username, also objects for this user
    createUser(user) {
      return fetch(`${this.endpointURL}/favourite`,
        {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user,
          })
        }
      ).then(response => {
        if(response.status != 404) {
          let data = response.json()
          // .then(data => data.data[0])
          .then(data => {
            this.favourites = data.starred
            this.home = data.home
            this.work = data.work
            this.username = data._id
          })
        }
      })
    },
    syncWithBackend(user) {

      this.user = user

      fetch(`${this.endpointURL}/favourite?user=${encodeURIComponent(user)}`)
      .then(response => {
        if(response.status >= 300) {
          // create user
          return this.createUser(user)
        }else {
          /*
            Get data from it
            Including:
              - userid,
              - favourites,
              - work,
              - home
          */
          return response.json().then(data => {
            if(data.data.length == 0) {
              return this.createUser(user)
            } else {
              let res = data.data[0]
              this.favourites = res.starred
              this.home = res.home
              this.work = res.work
              this.username = res._id
            }
          })
        }
      })

    }
  },
  computed: {
    isLoggedIn: function() {
      return this.username != null
    },
    suggestions: function() {
      if (this.suggestionFromLatLng == null || this.stations.length == 0) {
        return []
      }
      let distFunc = s => Math.pow(s.latLng.lat - this.suggestionFromLatLng.lat,2) + Math.pow(s.latLng.lng - this.suggestionFromLatLng.lng,2)
      // TODO: filter this according selection points (from/to)
      if(this.suggestFor == 'from') {
        let res = this.stations
          .filter(s => s.nbBikes > 0)
          .sort((s1,s2) => distFunc(s1) - distFunc(s2))
          .slice(0,this.nbSuggestions)
        return res
      }
      else {
        let res = this.stations
          .filter(s => s.nbEmptyDocks > 0)
          .sort((s1,s2) => distFunc(s1) - distFunc(s2))
          .slice(0,this.nbSuggestions)
        return res
      }

    },
    searchBoundary: function() {
      if(this.suggestions.length == []) return null
      let latLngs = this.suggestions.map(s => new google.maps.LatLng(s.latLng.lat,s.latLng.lng))
      let res = latLngs.reduce((bound,latlng) => bound.extend(latlng),new google.maps.LatLngBounds())
      return res
    }
  },
  mounted: function() {
    var jose = require('node-jose');
    this.setCenter()
    // check the login status

    let path = this.$route.path

    // 1. remove the leading '/'
    //2. split by params "&"
    //3. locate "access_token",
    //4. drop the "access_token=" part

    let token = path.substring(1).split('&').filter(s => s.indexOf('id_token') != -1)[0].replace('id_token=','')

    let idObject = JSON.parse(jose.util.base64url.decode(token.split('.')[1]))
    this.syncWithBackend(idObject.email)
    // this.syncWithBackend('helloWorld')
    setInterval(this.fetchStations,30000)
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
