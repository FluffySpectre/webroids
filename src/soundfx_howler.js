class SoundFX {
    constructor() {
        this.sfxClips = {};
        this.soundOn = true;
        this.clipsLoaded = false;
    }

    toggleSound() {
        this.soundOn = !this.soundOn;
    }

    loadSFXClips(sfxClips) {
        // sfxClips format:
        // sfxClips = {
        //     shoot: "assets/shoot.mp3"
        // };
        if (!sfxClips && typeof sfxClips !== "object") {
            return;
        }

        let newSfxClips = {};
        const clipNames = Object.keys(sfxClips);
        for (let cn of clipNames) {
            newSfxClips[cn] = this.loadAudioClip(sfxClips[cn]);
        }

        this.sfxClips = newSfxClips;
        this.clipsLoaded = true;
    }

    loadAudioClip(fileURL) {
        const clip = new Howl({
            src: [fileURL]
        });
        return clip;
    }

    playSound(clipName, loop = false) {
        if (this.soundOn) {
            const clipToUse = this.sfxClips[clipName];
            if (clipToUse) {
                clipToUse.loop(loop);
                clipToUse.play();
            }
        }
    }

    stopSound(clipName) {
        if (!this.sfxClips[clipName]) return;
        this.sfxClips[clipName].stop();
    }

    soundIsPlaying(clipName) {
        return this.sfxClips[clipName]
            && this.sfxClips[clipName].playing();
    }
}