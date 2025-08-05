<template>
  <v-stepper alt-labels editable hide-actions :items="['Step 1', 'Step 2', 'Step 3']" height="500">
    <template v-slot:item.1>
      <v-card title="Step One" flat
        >Lorem ipsum, dolor sit amet consectetur adipisicing elit. Totam eligendi, necessitatibus
        assumenda iure non nam fugit praesentium doloremque rem excepturi, expedita voluptates a
        saepe. Numquam repellat at ea sit repudiandae!</v-card
      >
    </template>

    <template v-slot:item.2>
      <v-card title="Step Two" flat
        >Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat aliquam cumque recusandae
        perspiciatis deleniti vitae, dolores maiores a voluptatum sunt dolore iste similique
        reiciendis at magni quis modi qui rem?</v-card
      >
    </template>

    <template v-slot:item.3>
      <v-card title="Step Three" flat
        >Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolor nihil necessitatibus
        placeat, excepturi dolore veniam quia quibusdam similique maxime nostrum quae voluptatem in?
        Dolor nihil expedita porro error veritatis dolores?</v-card
      >
    </template>
  </v-stepper>
</template>
