<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <section class="hero">
    <div class="hero-copy">
      <p class="hero-brand">
        {{ $t('site.title') }}
      </p>
      <h1 class="hero-title">
        {{ $t('home.heroTitle') }}
      </h1>
      <p class="hero-description">
        {{ $t('home.heroDescription') }}
      </p>

      <div class="hero-actions">
        <NuxtLink class="hero-button hero-button-primary" :to="localePath('calendar')">
          {{ $t('home.viewAllEvents') }}
        </NuxtLink>
      </div>
    </div>

    <div class="hero-accent" aria-hidden="true">
      <div class="hero-rhythm hero-rhythm-short" />
      <div class="hero-rhythm hero-rhythm-tall" />
      <div class="hero-rhythm hero-rhythm-mid" />
      <div class="hero-ring" />
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: clamp(20px, 4vw, 42px);
  padding: clamp(24px, 4vw, 34px);
  border: 1px solid var(--bct-panel-border);
  border-radius: calc(var(--bct-radius-lg) + 2px);
  background:
    linear-gradient(135deg, rgba(14, 28, 47, 0.98), rgba(7, 15, 28, 0.98)),
    var(--bct-panel);
  box-shadow: var(--bct-shadow);
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 18px;
  border: 1px solid rgba(200, 155, 70, 0.12);
  border-radius: calc(var(--bct-radius-lg) - 4px);
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.hero-brand {
  margin: 0;
  color: var(--bct-gold);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-title {
  max-width: 10ch;
  margin: 16px 0 0;
  color: var(--bct-cream-strong);
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(2.2rem, 4.5vw, 3.8rem);
  font-weight: 700;
  line-height: 0.98;
}

.hero-description {
  max-width: 42rem;
  margin: 18px 0 0;
  color: rgba(248, 237, 210, 0.78);
  font-size: clamp(1rem, 2vw, 1.12rem);
  line-height: 1.72;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 26px;
}

.hero-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;
}

.hero-button:hover,
.hero-button:focus-visible {
  transform: translateY(-1px);
}

.hero-button-primary {
  background: var(--bct-gold);
  color: #111827;
}

.hero-button-secondary {
  border-color: rgba(248, 237, 210, 0.28);
  background: rgba(255, 255, 255, 0.04);
  color: var(--bct-cream-strong);
}

.hero-button-secondary:hover,
.hero-button-secondary:focus-visible {
  border-color: rgba(200, 155, 70, 0.44);
  background: rgba(200, 155, 70, 0.1);
}

.hero-accent {
  position: relative;
  align-self: center;
  display: flex;
  align-items: end;
  gap: 10px;
  min-width: 112px;
  padding-right: 10px;
}

.hero-rhythm {
  width: 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(200, 155, 70, 0.92), rgba(159, 58, 36, 0.9));
  box-shadow: 0 0 0 1px rgba(200, 155, 70, 0.16);
}

.hero-rhythm-short {
  height: 52px;
}

.hero-rhythm-mid {
  height: 88px;
}

.hero-rhythm-tall {
  height: 132px;
}

.hero-ring {
  position: absolute;
  right: -18px;
  top: -4px;
  width: 82px;
  height: 82px;
  border: 1px solid rgba(200, 155, 70, 0.2);
  border-radius: 50%;
}

@media (max-width: 760px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-title {
    max-width: none;
  }

  .hero-accent {
    min-width: 0;
    padding-right: 0;
  }
}
</style>
