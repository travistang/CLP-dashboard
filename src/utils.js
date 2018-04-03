export const key = 'AIzaSyA1DUT-WiNg6AUuHZlnmoICcsviXv8IDPs'
export function searchPlaceByName(name) {
  let searchString = encodeURIComponent(name)
  return fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${searchString}&key=${key}`)
    .then(response => response.json())
}
