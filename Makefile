EXTENSION_TARGET = twitter-inline-images.oex
DIST_FILES = config.xml icon.png includes/base.js index.html

all:

dist: $(EXTENSION_TARGET)

$(EXTENSION_TARGET): $(DIST_FILES)
	zip -9r $(EXTENSION_TARGET) $(DIST_FILES)
