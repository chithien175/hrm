require('../packages/PreventGhostClick')

export default {
    methods: {
        /*                Item                */
        selectFirst() {
            this.$nextTick(() => {
                this.scrollToFile(this.getElementByIndex(0))
            })
        },
        isSelected(file) {
            return this.selectedFile == file
        },
        setSelected(file, index, e = null) {
            if (!this.isBulkSelecting() && this.isSelected(file)) return

            EventHub.fire('stopHammerPropagate')

            if (e && e.metaKey && !this.firstMeta) {
                this.firstMeta = true
                this.bulkSelect = true
                this.pushtoBulkList(this.selectedFile)
            }

            // select with shift
            if (e && e.shiftKey) {
                this.bulkSelect = true
                this.bulkList = []

                // forward
                let begin = this.currentFileIndex
                let end = index
                let dir = 'forward'

                // backward
                if (begin > index) {
                    begin = index
                    end = this.currentFileIndex
                    dir = 'backward'
                }

                let indexList = this.getIndexRange(begin, end)

                indexList.map((i) => {
                    this.getElementByIndex(i).click()
                })

                // to have the same expected pattern as normal shift + click
                if (dir == 'forward') {
                    this.selectedFile = this.bulkList[0]
                    this.currentFileIndex = indexList[0]
                } else {
                    this.selectedFile = this.bulkList[this.bulkItemsCount - 1]
                    this.currentFileIndex = indexList[indexList.length - 1]
                }

                return
            }

            // normal selection
            this.selectedFile = file
            this.currentFileIndex = index

            if (this.lazyModeIsOn()) {
                this.lazyImageActivate(file.path)
            }

            // bulk selection
            if (this.isBulkSelecting()) {
                this.pushtoBulkList(file)
            }
        },
        selectedFileIs(val) {
            if (this.selectedFile !== null) {
                return this.fileTypeIs(this.selectedFile, val)
            }
        },
        dbltap(e) {
            PreventGhostClick(e.target)

            if (!this.isBulkSelecting()) {
                if (this.selectedFileIs('image') || this.selectedFileIs('pdf') || this.selectedFileIs('text')) {
                    return this.toggleModal('preview_modal')
                }

                if (this.selectedFileIs('video') || this.selectedFileIs('audio')) {
                    return this.smallScreen
                        ? this.toggleModal('preview_modal')
                        : this.playMedia()
                }

                this.openFolder(this.selectedFile)
            }
        },

        /*                Folder                */
        openFolder(file) {
            if (this.fileTypeIs(file, 'folder')) {
                this.folders.push(file.name)
                this.getFiles(this.folders).then(() => {
                    this.updatePageUrl()
                })
            }
        },
        goToFolder(index) {
            if (!this.isBulkSelecting()) {
                let prev_folder_name = this.folders[index]

                this.folders = this.folders.splice(0, index)

                this.getFiles(this.folders, prev_folder_name).then(() => {
                    this.updatePageUrl()
                })
            }
        },
        goToPrevFolder() {
            EventHub.fire('stopHammerPropagate')

            if (this.restrictModeIsOn()) {
                return false
            }

            let length = this.folders.length

            return length == 0
                ? false
                : this.goToFolder(length - 1)
        },

        /*                Navigation                */
        navigation(e) {
            let key = keycode(e)

            // go to prev item
            if (key == 'left') {
                e.preventDefault()
                this.goToPrev()
            }

            // go to prev row
            if (key == 'up') {
                e.preventDefault()
                this.goToPrevRow()
            }

            // go to next item
            if (key == 'right') {
                e.preventDefault()
                this.goToNext()
            }

            // go to next row
            if (key == 'down') {
                e.preventDefault()
                this.goToNextRow()
            }

            // go to last item
            if (key == 'end') {
                e.preventDefault()
                this.goToEnd()
            }

            // go to first item
            if (key == 'home') {
                e.preventDefault()
                this.goToHome()
            }

            // toggle modal off
            if (
                this.isActiveModal('preview_modal') &&
                (this.selectedFileIs('folder') || this.selectedFileIs('application')) ||
                (this.selectedFileIs('video') || this.selectedFileIs('audio')) && !this.smallScreen
            ) {
                this.toggleModal()
            }
        },
        goToPrev() {
            let curSelectedIndex = this.currentFileIndex

            if (curSelectedIndex !== 0) {
                this.imageSlideDirection = 'prev'
                this.scrollToFile(this.getElementByIndex(curSelectedIndex - 1))
            }
        },
        goToNext() {
            let curSelectedIndex = this.currentFileIndex

            if (curSelectedIndex < this.allItemsCount - 1) {
                this.imageSlideDirection = 'next'
                this.scrollToFile(this.getElementByIndex(curSelectedIndex + 1))
            }
        },
        goToEnd() {
            this.imageSlideDirection = 'next'

            let last = this.filesList.length - 1
            this.scrollToFile(this.getElementByIndex(last))
        },
        goToHome() {
            this.imageSlideDirection = 'prev'
            this.scrollToFile(this.getElementByIndex(0))
        },

        goToPrevRow() {
            let curSelectedIndex = this.currentFileIndex
            let moveBy = this.scrollByRows

            if (curSelectedIndex >= moveBy) {
                this.imageSlideDirection = 'prev'
                this.scrollToFile(this.getElementByIndex(curSelectedIndex - moveBy))
            }
        },
        goToNextRow() {
            let curSelectedIndex = this.currentFileIndex
            let moveBy = this.scrollByRows
            this.imageSlideDirection = 'next'

            if (curSelectedIndex < this.allItemsCount - moveBy) {
                this.scrollToFile(this.getElementByIndex(curSelectedIndex + moveBy))
            } else {
                this.goToEnd()
            }
        }
    }
}
