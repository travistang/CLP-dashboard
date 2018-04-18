<template>
  <div class="info-window-container">
    <div class="row">
      <div class="btn" @click="emitFrom">
        From
      </div>
      <div class="btn" @click="emitTo">
        To
      </div>
    </div>
    <div class="row">
      <div class="btn" @click="setHome">
        Set location as Home
      </div>
    </div>
    <div class="row">
      <div class="btn" @click="setWork">
        Set location as Work
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    click: function() {

    },
    emitFrom:function() {
      this.$emit(
        'action',
        {
          action: 'from'
        }
      )
    },
    emitTo:function() {
      this.$emit(
        'action',
        {
          action: 'to'
        }
      )
    },
    setHome: function() {
      // TODO: set this as home
    },
    setWork: function() {
      // TODO: set this as workplace
    },
  }
}
</script>

<style>
.info-window-container {
  display: flex;
  display: -webkit-flex;
  flex-direction: column;
  height: 100px;
  width: 100px;
  flex: 1;

}
.row {
  display: flex;
  display: -webkit-flex;
  flex: 1;
  flex-direction: row;
}
.btn {
  flex: 1;
  width: 100%;
  display: flex;
  display: -webkit-flex;
  justify-content: center;
  align-items: center;
  /* border: 1px solid black; */
}
</style>
