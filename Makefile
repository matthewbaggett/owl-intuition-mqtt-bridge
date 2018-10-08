all: prepare build push

prepare:
	docker-compose build owl-mqtt-bridge

build:
	docker-compose run owl-mqtt-bridge npm install
	docker-compose run owl-mqtt-bridge npm rebuild

update:
	docker-compose run owl-mqtt-bridge npm update

push:
	docker-compose push owl-mqtt-bridge

run:
	docker run \
		--net=host \
		-e "MQTT_HOST=mqtt://10.188.5.1" \
		matthewbaggett/owl-intuition-mqtt-bridge