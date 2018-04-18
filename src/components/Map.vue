<template>
  <gmap-map
    id="google-map"
    :center="center"
    :zoom="18"
    :options="options"
    class="map-main"
    @click="mapClicked"
    @drag="mapDragged"
    @rightclick="mapRightClicked"
    ref="map"
  >
    <gmap-marker
      :key="m.id"
      v-for="(m, index) in generalStationMarkerList"
      :position="m.latLng"
      :clickable="true"
      :draggable="false"
      :opacity="generalStationMarkerOpacity"
      @click="() => openSetFavouriteInfoWindow(m)"
      @mouseover="() => infoWindowFlag.push(m.id)"
      @mouseout="() => infoWindowFlag = infoWindowFlag.filter(i => i != m.id)"
      :icon="() => getGeneralStationMarkerIcon(m)"
    >
      <gmap-info-window
        v-if="favouriteStationCandidate"
      >
        <div class="station-info-window-main" @click="setCandidateAsFavourite">
          {{isCandidateFavourite?"Remove as favourite":"Set as favourite"}}
        </div>
      </gmap-info-window>
      <gmap-info-window
        v-if="infoWindowFlag.indexOf(m.id) != -1"
      >
        <div class="station-info-window-main">
          <div class="station-info-window-name">
            {{m.name}}
          </div>
          <div class="station-info-window-details">
            {{m.nbBikes}} bike{{m.nbBikes > 1?'s':''}}.
            {{m.nbEmptyDocks}} empty dock{{m.nbEmptyDocks > 1?'s':''}} available.
          </div>
        </div>

      </gmap-info-window>
    </gmap-marker>

    <gmap-marker
      :key="m.name"
      v-for="(m,index) in nameSearchCandidates"
      :position="m.geometry.location"
      :clickable="false"
      :draggable="false"
      :label="m.name"
      icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    ></gmap-marker>
    <!-- TODO: @ click -->
    <gmap-marker
      :key="m.id"
      v-for="(m,index) in suggestions"
      :position="m.latLng"
      :clickable="true"
      :draggable="false"
      icon="http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
      @click="() => $emit('selectSuggestion',m)"
      @mouseover="onHoverSuggestion(m)"
      @mouseout="onLeaveSuggestion(m)"
    >

      <gmap-info-window
        v-if="infoWindowFlag.indexOf(m.id) != -1 || (previewSuggestion != null && previewSuggestion.id == m.id)"
      >
        <div class="station-info-window-main">
          <div class="station-info-window-name">
            {{m.name}}
          </div>
          <div class="station-info-window-details">
            {{m.nbBikes}} bike{{m.nbBikes > 1?'s':''}}.
            {{m.nbEmptyDocks}} empty dock{{m.nbEmptyDocks > 1?'s':''}} available.
          </div>
        </div>

      </gmap-info-window>
    </gmap-marker>
    <!-- Fixed markers for inidicating from and to -->


    <gmap-marker
      :position="selectedFrom.latLng"
      v-if="selectedFrom"
      icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
      label="from"

    ></gmap-marker>

    <gmap-marker
      :position="selectedTo.latLng"
      v-if="selectedTo"
      icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
      label="to"

    ></gmap-marker>

    <gmap-info-window
      v-if="selectedLocation != null"
      :position="selectedLocation">
      <InfoWindow @action="emitLocation"/>
    </gmap-info-window>
    <gmap-polyline
      v-if="routePoints.length > 0"
      :path="routePoints"
      ref="route"
    >
  </gmap-polyline>
    </gmap>
  </gmap-map>
</template>
<script>
import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'
import { loaded } from 'vue2-google-maps'
import InfoWindow from './InfoWindow'
import { key } from '../utils'
Vue.use(VueGoogleMaps, {
  load: {
    key: key,
    libraries: 'places',
  }
})

export default {
  components: {
    InfoWindow,
  },
  props: {
    favourites: {
      type: Array,
      default: () => []
    },
    center: {
      type: Object,
      default: () => ({lat: 0, lng: 0}),
    },
    stations: {
      type: Array,
      default: () => [],
    },
    suggestions: {
      type: Array,
      required: false,
      default: () => [],
    },
    nameSearchCandidates: {
      type: Array,
      required: true,
      default: () => [],
    },
    selectedFrom: {
      required: true
    },
    selectedTo: {
      required: true
    },
    previewSuggestion: {
      default: () => null
    }
  },

  data() {
    return {
      options: {
        // google map options here
        disableDefaultUI: true,
        minZoom: 15,
      },

      visibleMarkers: [],
      // flags for toggling all info windows on hover
      infoWindowFlag: [],

      selectedLocation: null,

      routePoints: [],

      favouriteStationCandidate: null,
    }
  },
  watch: {
    center: function(v) {
      this.updateVisibleMarkers()
    },
    stations: function(v) {
      this.updateVisibleMarkers()
    },
    // this is to adjust the map to fit the bound of the object
    suggestions: function(lists) {
      if(lists && lists.length > 1) {
        // extend latlng bounds according to the list of suggestions
        let bound = lists.reduce((b,s) => b.extend(this.getLatLngFromStation(s)),new google.maps.LatLngBounds())
        // then fit it to the map
        this.$refs.map.$mapObject.fitBounds(bound)
      }
    },
    // detect (de)selections of the endpoints
    selectedFrom: function(v){this.onEndpointChange(v)},
    selectedTo: function(v){this.onEndpointChange(v)}
  },
  mounted: function() {
    this.$refs.map.$mapCreated.then(map => {
      this.$emit('mapAcquired',map)
    })
  },
  methods: {
    setCandidateAsFavourite: function() {
      // TODO: get favourite from state of this component, then submit to endpoint
    },
    onHoverSuggestion: function(point) {
      // let the info window of the point flows
      this.infoWindowFlag.push(point.id)
      // then emit the suggestion preview event
      this.$emit('previewSuggestion',point)
    },
    onLeaveSuggestion: function(point){
      this.infoWindowFlag = this.infoWindowFlag.filter(i => i != point.id)
      this.$emit('previewSuggestion',null)
    },
    onEndpointChange: function(point) {
      // if not both of the endpoints are selected, do nothing
      /*
        Otherwise...
        1. fit the map to show the from - to endpoints
        2. plot the route

      */
      if(this.selectedFrom && this.selectedTo) {
        //1.
        // prepare the bound that fits the both start and end point
        let fromLatLng = this.getLatLngFromStation(this.selectedFrom)
        let toLatLng = this.getLatLngFromStation(this.selectedTo)
        let bounds = new google.maps.LatLngBounds()
        bounds.extend(fromLatLng).extend(toLatLng)
        this.$refs.map.$mapObject.fitBounds(bounds)
        //2.
        this.plotRoute()
      }
    },
    // listeners
    mapClicked: function(event) {
      // hide the selection
      this.selectedLocation = null
    },

    mapDragged: function(event) {
      this.updateVisibleMarkers()
    },

    mapRightClicked: function(event) {
      let lat = event.latLng.lat()
      let lng = event.latLng.lng()
      this.selectedLocation = {lat,lng}
    },

    emitLocation: function(payload) {
      this.$emit(payload.action,this.selectedLocation)
      this.selectedLocation = null
    },
    // common methods
    getViewBoundary: function() {
      let bound = this.$refs.map.$mapObject.getBounds()
      var lat0 = bound.getNorthEast().lat();
      var lng0 = bound.getNorthEast().lng();
      var lat1 = bound.getSouthWest().lat();
      var lng1 = bound.getSouthWest().lng();
      let res = {
        lat: [lat0,lat1],
        lng: [lng0,lng1],
      }
      return res
    },
    updateVisibleMarkers: function(){
      try{
        let bounds = this.getViewBoundary()
        let isInBound = (latLng) => {
          if (latLng.lat < bounds.lat[1] || latLng.lat > bounds.lat[0]) return false
          if (latLng.lng < bounds.lng[1] || latLng.lng > bounds.lng[0]) return false
          return true
        }
        this.visibleMarkers = this.stations.filter(s => isInBound(s.latLng))
      }catch(e) {
        this.visibleMarkers = []
      }

    },
    // a common helper function that get google.maps.LatLng object out of a station object
    getLatLngFromStation: function(s) {
      return new google.maps.LatLng(s.latLng.lat,s.latLng.lng)
    },
    // functions for plotting the route between from and to points
    // modified from https://stackoverflow.com/questions/5425930/google-maps-displaying-a-route
    plotRoute: function() {
      let request = {
          origin: this.getLatLngFromStation(this.selectedFrom),
          destination: this.getLatLngFromStation(this.selectedTo),
          // waypoints: waypts,
          optimizeWaypoints: true,
          travelMode: google.maps.DirectionsTravelMode.BICYCLING
      };
      new google.maps.DirectionsService().route(request,(response,status) => {
        if (status == google.maps.DirectionsStatus.OK) {
            // this.directionsDisplay.setDirections(response);
            let route = response.routes[0];
            this.routePoints = google.maps.geometry.encoding.decodePath(route.overview_polyline)
        }
        else {
          // TODO: error occured...
          console.log('error occured')
        }
      })
    }
  },
  computed: {
    isCandidateFavourite: function() {
      if(favouriteStationCandidate) {
        return this.favourites.filter(f => f.id).indexOf(favouriteStationCandidate.id) != -1
      }
    },
    getGeneralStationMarkerIcon: function(m) {
      let markerColor = 'red' // default color
      if(m.nbEmptyDocks == 0) {
        markerColor = 'purple'
      }
      return `http://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`
    },
    generalStationMarkerOpacity: function() {
      let lowOpacity = 0.5
      let highOpacity = 1

      if(this.suggestions.length > 0) return lowOpacity
      if(this.selectedFrom || this.selectedTo) return lowOpacity
      return highOpacity
    },
    generalStationMarkerList: function() {
      return this.visibleMarkers.filter(m => this.suggestions.map(s => s.id).indexOf(m.id) == -1)
        .filter(m => !this.selectedFrom || m.id != this.selectedFrom.id)
        .filter(m => !this.selectedTo || m.id != this.selectedTo.id)
    }
  },

}
</script>

<style>
.map-main {
  position: absolute;
  left: 0;
  right: 0;
  height: 100%;
  width: 100%;
}
.gm-style-iw + div {display: none;}
</style>
