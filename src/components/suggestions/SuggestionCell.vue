<template>
  <div
    @click="$emit('click')"
    :class="suggestionCellClass"
    @mouseover="() => this.$emit('previewSuggestion',this.suggestion)"
    @mouseleave="() => this.$emit('previewSuggestion',null)"
  >
    <div class="suggestion-name">
      {{suggestion.name}}
    </div>
    <div class="suggestion-details">
      <div class="suggestion-detail-item">
        {{distanceFromLatLng}}
      </div>
      <div class="suggestion-detail-item">
        {{suggestion.nbEmptyDocks}}/{{suggestion.nbDocks}}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    suggestion: {
      type: Object,
      required: true,
    },
    fromLatLng: {
      type: Object,
      required: true,
    },
    isUnderPreview: {
      type: Boolean,
      default: false,
    }
  },
  computed: {
    distanceFromLatLng: function() {
      function distance(lat1, lon1, lat2, lon2) {
        var p = 0.017453292519943295;    // Math.PI / 180
        var c = Math.cos;
        var a = 0.5 - c((lat2 - lat1) * p)/2 +
                c(lat1 * p) * c(lat2 * p) *
                (1 - c((lon2 - lon1) * p))/2;

        return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
      }
      return distance(this.suggestion.latLng.lat,
        this.suggestion.latLng.lng,
        this.fromLatLng.lat,
        this.fromLatLng.lng)
        .toFixed(3)
        .toString() + ' km'
    },
    suggestionCellClass: function() {
      let base = 'suggestion-cell-main'
      return this.isUnderPreview?(base + ' ' + 'suggestion-cell-preview'):base
    }
  }
}
</script>

<style>
.suggestion-cell-main {
  display: flex;
  padding: 4px;
  display: -webkit-flex;
  flex-direction: column;
  height: 100px;
  /* width: 100%; */
  box-shadow: 1px 2px 2px rgba(0,0,0,0.3);
  text-align: center;
  border: 1px solid rgba(0,0,0,0.3);
  margin-bottom: 4px;
}
.suggestion-cell-preview {
  background: rgba(0,0,0,0.3);
  color: white;
}
.suggestion-cell-main:hover {
  background: rgba(0,0,0,0.3);
  color: white;
}
.suggestion-name {
  font-size: 24px;
  text-align: left;
  flex: 1;
}
.suggestion-details {
  flex: 1;
  display: flex;
  display: -webkit-flex;
  justify-content: space-around;
}
.suggestion-detail-item {
  flex: 1;

}
</style>
