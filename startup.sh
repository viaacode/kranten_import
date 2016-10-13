#! /bin/sh --

broker='amqp://user:password@rabbithost:5672/?heartbeat=120'
elastic='http://elastichost:9200/index/'

function run_listener () {
	node ./listeners/${1} \
		--broker="${broker}" \
		--listenqueue=${2} \
		--replyqueue=${3} \
		--durable --verbose --pretty &
		--elasticsearch=${elastic}/${1} \
}

# run_listener forward-listener create_zip_queue kranten_file_complete
# run_listener copy-listener create_jp2_queue kranten_file_complete

run listener forward-listener jp2_responses kranten_file_complete
run_listener rm-listener kranten_ex_rm_private_dir kranten_continue_recover
run_listener copy-listener kranten_ex_copy_file kranten_file_complete
run_listener alto-listener kranten_ex_embed_alto kranten_altos_complete
run_listener listing-listener kranten_ex_list_directory kranten_listing_complete
run_listener mets-listener kranten_ex_generate_mets kranten_mets_complete
