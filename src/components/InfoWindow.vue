<template>
  <div class="info-window-container">
    <div class="btn" @click="emitFrom">
      From
    </div>
    <div class="btn" @click="emitTo">
      To
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
    }
  }
}
</script>

<style>
.info-window-container {
  display: flex;
  display: -webkit-flex;
  flex-direction: row;
  height: 100px;
  width: 100px;
  flex: 1;

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
