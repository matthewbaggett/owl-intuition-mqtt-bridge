all: prepare build push

prepare:
	docker build -f Dockerfile.Build .

build:
	docker build -t matthewbaggett/owl-intuition-mqtt-bridge .

push:
	docker push matthewbaggett/owl-intuition-mqtt-bridge

run:
	docker run \
		--net=host \
		-e "MQTT_HOST=mqtt://10.188.5.1" \
		matthewbaggett/owl-intuition-mqtt-bridge