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
        const clip = new Audio(fileURL);
        clip.load();
        return clip;
    }

    playSound(clipName, loop = false) {
        if (this.soundOn) {
            let clipToUse = this.sfxClips[clipName];
            if (clipToUse) {
                let cName = clipName;
                let i = 2;
                while (this.sfxClips[cName] && this.soundIsPlaying(cName)) {
                    clipToUse = this.sfxClips[cName];
                    cName = clipName + i;
                    i++;
                }
                if (clipToUse) {
                    clipToUse.loop = loop;
                    clipToUse.play().catch(() => {});
                }
            }
        }
    }

    stopSound(clipName) {
        if (!this.sfxClips[clipName]) return;
        this.sfxClips[clipName].pause();
        this.sfxClips[clipName].currentTime = 0;
    }

    soundIsPlaying(clipName) {
        return this.sfxClips[clipName]
            && this.sfxClips[clipName].currentTime > 0
            && !this.sfxClips[clipName].paused
            && !this.sfxClips[clipName].ended
            && this.sfxClips[clipName].readyState > 2;
    }
}